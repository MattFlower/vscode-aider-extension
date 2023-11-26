import * as vscode from 'vscode';
import { AiderInterface, AiderTerminal } from './AiderTerminal';

let terminal: AiderInterface | null = null;
let filesOpen = new Set<string>();

function createTerminal() { 
    let openaiApiKey: string | null | undefined = vscode.workspace.getConfiguration('aider').get('openaiApiKey');
    let aiderCommandLine: string = vscode.workspace.getConfiguration('aider').get('commandLine') ?? 'aider';
    terminal = new AiderTerminal(openaiApiKey, aiderCommandLine, handleTerminalClose);
}

function handleTerminalClose() {
    terminal?.dispose();
    terminal = null;
}

function updateEditors() {
    if (!terminal) {
        console.log("No terminals, not going to update editors");
        return;
    }

    let newFilesOpen = new Set<string>();
    vscode.workspace.textDocuments.forEach((document) => {
        if (document.uri.scheme === "file" && document.fileName && terminal?.isWorkspaceFile(document.fileName)) {
            newFilesOpen.add(document.fileName);
        }
    });

    let opened: string[] = [];
    let closed: string[] = [];
    
    newFilesOpen.forEach((item) => {
        if (!filesOpen.has(item)) {
            opened.push(item);
        }
    });

    filesOpen.forEach((item) => {
        if (!newFilesOpen.has(item)) {
            closed.push(item);
        }
    });

    let ignoreFiles = vscode.workspace.getConfiguration('aider').get('ignoreFiles') as string[];
    let ignoreFilesRegex = ignoreFiles.map((regex) => new RegExp(regex));
    
    opened.forEach((item) => {
        if (!ignoreFilesRegex.some((regex) => regex.test(item))) {
            terminal?.addFile(item);
        }
    });

    closed.forEach((item) => {
        if (!ignoreFilesRegex.some((regex) => regex.test(item))) {
            terminal?.dropFile(item);
        }
    });

    filesOpen = newFilesOpen;
}

vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('aider.openaiApiKey')) {
        // Stop the Aider terminal
        if (terminal) {
            terminal.dispose();
            terminal = null;
        }

        // Restart the Aider terminal with the new API key
        createTerminal();
        
        // Add all currently open files
        updateEditors();
    }
});

export function activate(context: vscode.ExtensionContext) {
    vscode.workspace.onDidOpenTextDocument((document) => {
        if (terminal) {
            if (document.uri.scheme === "file" && document.fileName && terminal.isWorkspaceFile(document.fileName)) {
                let filePath = document.fileName;
                let ignoreFiles = vscode.workspace.getConfiguration('aider').get('ignoreFiles') as string[];
                let shouldIgnore = ignoreFiles.some((regex) => new RegExp(regex).test(filePath));

                if (!shouldIgnore) {
                    terminal.addFile(filePath);
                    filesOpen.add(document.fileName);
                }
            }
        }
    });
    vscode.workspace.onDidCloseTextDocument((document) => {
        if (terminal) {
            if (document.uri.scheme === "file" && document.fileName && terminal.isWorkspaceFile(document.fileName)) {
                let filePath = document.fileName;
                let ignoreFiles = vscode.workspace.getConfiguration('aider').get('ignoreFiles') as string[];
                let shouldIgnore = ignoreFiles.some((regex) => new RegExp(regex).test(filePath));

                if (!shouldIgnore) {
                    terminal.dropFile(filePath);
                    filesOpen.delete(document.fileName);
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
        if (terminal) {
            filesOpen.add(filePath);
            terminal.addFile(filePath);
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
        if (terminal) {
            filesOpen.delete(filePath);
            terminal.dropFile(filePath);
        }
    });
    
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('aider.syncFiles', function () {
        updateEditors();
    });

    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('aider.open', function () {
        if (!terminal) {
            createTerminal();
        }

        if (terminal) {
            terminal.show();
        }

        updateEditors();
    });

    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('aider.close', function () {
        // The code you place here will be executed every time your command is executed
        // Terminate the Aider process
        if (terminal) {
            terminal.dispose();
            terminal = null;
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
