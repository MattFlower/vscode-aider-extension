import * as vscode from 'vscode';
import { AiderInterface, AiderTerminal } from './AiderTerminal';
import fs = require('fs');
import path = require('path');

let aider: AiderInterface | null = null;
let filesThatAiderKnows = new Set<string>();

/**
 * Create the Aider interface (currently a terminal) and start it.
 */
async function createAider() { 
    const config = vscode.workspace.getConfiguration('aider');
    let openaiApiKey: string | null | undefined = config.get('openaiApiKey');
    let aiderCommandLine: string = config.get('commandLine') ?? 'aider';
    let workingDirectory: string | undefined = config.get('workingDirectory');

    findWorkingDirectory(workingDirectory).then((workingDirectory) => {
        aider = new AiderTerminal(openaiApiKey, aiderCommandLine, handleAiderClose, workingDirectory);
    }).catch((err) => {
        vscode.window.showErrorMessage(`Error starting Aider: ${err}`);
    });
}

/**
 * If the Aider terminal is closed, update local variables to reflect the change.
 */
function handleAiderClose() {
    aider?.dispose();
    aider = null;
}

/**
 * Figure out which files are open in VS Code and which ones are known to be open in Aider.  Synchronize the
 * two.  
 * 
 * Note this method has a flaw -- if a user opens a file using directly using /add in Aider, we won't know 
 * about it.  This might lead to duplicate /add statements.
 */
function syncAiderAndVSCodeFiles() {
    let filesThatVSCodeKnows = new Set<string>();
    vscode.workspace.textDocuments.forEach((document) => {
        if (document.uri.scheme === "file" && document.fileName && aider?.isWorkspaceFile(document.fileName)) {
            filesThatVSCodeKnows.add(document.fileName);
        }
    });

    let opened = [...filesThatVSCodeKnows].filter(x => !filesThatAiderKnows.has(x));
    let closed = [...filesThatAiderKnows].filter(x => !filesThatVSCodeKnows.has(x));
    
    let ignoreFiles = vscode.workspace.getConfiguration('aider').get('ignoreFiles') as string[];
    let ignoreFilesRegex = ignoreFiles.map((regex) => new RegExp(regex));
    
    opened = opened.filter((item) => !ignoreFilesRegex.some((regex) => regex.test(item)));
    opened.forEach((item) => { aider?.addFile(item); });

    closed = closed.filter((item) => !ignoreFilesRegex.some((regex) => regex.test(item)));
    closed.forEach((item) => { aider?.dropFile(item); });

    filesThatAiderKnows = filesThatVSCodeKnows;
}

/**
 * Find a working directory for Aider.
 * 
 * @returns A promise pointing to a working directory for Aider.
 */
export async function findWorkingDirectory(overridePath?: string): Promise<string> {
    if (overridePath && overridePath.trim() !== '') {
        return overridePath;
    }
    // If there is more than one workspace folder, ask the user which workspace they want aider for
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 1) {
        let items: vscode.QuickPickItem[] = [];
        for (let workspaceFolder of vscode.workspace.workspaceFolders) {
            items.push({label: workspaceFolder.name, description: workspaceFolder.uri.fsPath});
        }
        items.push({label: "Select a folder...", description: ""});

        let workspaceThen = vscode.window.showQuickPick(items, {placeHolder: "Select a folder to use with Aider"});
        let workspace = await workspaceThen;
        if (workspace) {
            if (workspace.label === "Select a folder...") {
                let otherFolderThen = vscode.window.showOpenDialog({canSelectFiles: false, canSelectFolders: true, canSelectMany: false});
                let otherFolder = await otherFolderThen;
                if (otherFolder) {
                    return findGitDirectoryInSelfOrParents(otherFolder[0].fsPath);
                } else {
                    throw new Error("Starting Aider requires a workspace folder.  Aborting...");
                }
            }

            return findGitDirectoryInSelfOrParents(workspace.description!);
        } else {
            throw new Error("Starting Aider requires a workspace folder.  Aborting...");
        }
    } else if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length == 1) {
        let workspaceFolder = vscode.workspace.workspaceFolders[0];
        return findGitDirectoryInSelfOrParents(workspaceFolder.uri.fsPath);
    } else if (vscode.window.activeTextEditor?.document?.fileName) {
        let filePath = vscode.window.activeTextEditor.document.fileName;
        let components = filePath.split("/");
        components.pop();
        filePath = components.join("/");
        return findGitDirectoryInSelfOrParents(filePath);
    } else {
        let otherFolderThen = vscode.window.showOpenDialog({canSelectFiles: false, canSelectFolders: true, canSelectMany: false});
        let otherFolder = await otherFolderThen;
        if (otherFolder) {
            return findGitDirectoryInSelfOrParents(otherFolder[0].fsPath);
        } else {
            throw new Error("Starting Aider requires a workspace folder.  Aborting...");
        }
    }
}

function findGitDirectoryInSelfOrParents(filePath: string): string {
    let dirs: string[] = filePath.split(path.sep).filter((item) => { return item !== ""});
    while (dirs.length > 0) {
        try {
            let isWin = path.sep === "\\";
            let dir;
            if (dirs && isWin) {
                dir = dirs.join("\\") + "\\.git";
            } else {
                dir = "/" + dirs.join("/") + "/.git";
            }
            if (fs.statSync(dir) !== undefined) {
                if (isWin) {
                    return dirs.join("\\") + "\\";
                } else {
                    return "/" + dirs.join("/") + "/";
                }
            } else {
                dirs.pop();
            }
        } catch(err) {
            dirs.pop();
        }
    }

    return "/";
}

/**
 * If the API Key changes in the settings, restart the Aider terminal so it will use the new 
 * API key.
 */
vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('aider.openaiApiKey')) {
        // Stop the Aider terminal
        if (aider) {
            aider.dispose();
            aider = null;
        }

        // Restart the Aider terminal with the new API key
        createAider();
        
        // Add all currently open files
        syncAiderAndVSCodeFiles();
    }
});

export function activate(context: vscode.ExtensionContext) {
    vscode.workspace.onDidOpenTextDocument((document) => {
        if (aider) {
            if (document.uri.scheme === "file" && document.fileName && aider.isWorkspaceFile(document.fileName)) {
                let filePath = document.fileName;
                let ignoreFiles = vscode.workspace.getConfiguration('aider').get('ignoreFiles') as string[];
                let shouldIgnore = ignoreFiles.some((regex) => new RegExp(regex).test(filePath));

                if (!shouldIgnore) {
                    aider.addFile(filePath);
                    filesThatAiderKnows.add(document.fileName);
                }
            }
        }
    });
    vscode.workspace.onDidCloseTextDocument((document) => {
        if (aider) {
            if (document.uri.scheme === "file" && document.fileName && aider.isWorkspaceFile(document.fileName)) {
                let filePath = document.fileName;
                let ignoreFiles = vscode.workspace.getConfiguration('aider').get('ignoreFiles') as string[];
                let shouldIgnore = ignoreFiles.some((regex) => new RegExp(regex).test(filePath));

                if (!shouldIgnore) {
                    aider.dropFile(filePath);
                    filesThatAiderKnows.delete(document.fileName);
                }
            }
        }
    });

    let disposable = vscode.commands.registerCommand('aider.add', function () {
        if (!aider) {
            vscode.window.showErrorMessage("Aider is not running.  Please run the 'Open Aider' command first.");
        }

        // The code you place here will be executed every time your command is executed
        // Get the currently selected file in VS Code
        let activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            return; // No open text editor
        }
        let filePath = activeEditor.document.fileName;

        // Send the "/add <filename>" command to the Aider process
        if (aider) {
            filesThatAiderKnows.add(filePath);
            aider.addFile(filePath);
        }
    });

    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('aider.drop', function () {
        if (!aider) {
            vscode.window.showErrorMessage("Aider is not running.  Please run the 'Open Aider' command first.");
        }

        // The code you place here will be executed every time your command is executed
        // Get the currently selected file in VS Code
        let activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            return; // No open text editor
        }
        let filePath = activeEditor.document.fileName;

        // Send the "/drop <filename>" command to the Aider process
        if (aider) {
            filesThatAiderKnows.delete(filePath);
            aider.dropFile(filePath);
        }
    });
    
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('aider.syncFiles', function () {
        if (!aider) {
            vscode.window.showErrorMessage("Aider is not running.  Please run the 'Open Aider' command first.");
        }

        syncAiderAndVSCodeFiles();
    });

    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('aider.open', function () {
        if (!aider) {
            createAider();
        }

        if (aider) {
            aider.show();
        }

        syncAiderAndVSCodeFiles();
    });

    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('aider.close', function () {
        if (!aider) {
            vscode.window.showErrorMessage("Aider is not running.  Please run the 'Open Aider' command first.");
        }

        // The code you place here will be executed every time your command is executed
        // Terminate the Aider process
        if (aider) {
            aider.dispose();
            aider = null;
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
