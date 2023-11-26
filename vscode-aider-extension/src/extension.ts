import * as vscode from 'vscode';
import { AiderInterface, AiderTerminal } from './AiderTerminal';

let aider: AiderInterface | null = null;
let filesThatAiderKnows = new Set<string>();

/**
 * Create the Aider interface (currently a terminal) and start it.
 */
function createAider() { 
    let openaiApiKey: string | null | undefined = vscode.workspace.getConfiguration('aider').get('openaiApiKey');
    let aiderCommandLine: string = vscode.workspace.getConfiguration('aider').get('commandLine') ?? 'aider';
    aider = new AiderTerminal(openaiApiKey, aiderCommandLine, handleAiderClose);
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
    if (!aider) {
        console.log("Aider not started yet, so can't sync files");
        return;
        
    }
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
