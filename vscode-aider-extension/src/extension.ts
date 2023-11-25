import * as vscode from 'vscode';
import { exec } from 'child_process';

let openaiApiKey = vscode.workspace.getConfiguration('aider').get('openaiApiKey');
let terminal: vscode.Terminal | null = vscode.window.createTerminal('Aider', '/bin/sh', ['-c', `export OPENAI_API_KEY=${openaiApiKey}; exec $SHELL`]);

vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('aider.openaiApiKey')) {
        // Stop the Aider terminal
        if (terminal) {
            terminal.dispose();
            terminal = null;
        }

        // Restart the Aider terminal with the new API key
        openaiApiKey = vscode.workspace.getConfiguration('aider').get('openaiApiKey');
        terminal = vscode.window.createTerminal('Aider', '/bin/sh', ['-c', `export OPENAI_API_KEY=${openaiApiKey}; exec $SHELL`]);

        // Add all currently open files
        vscode.window.visibleTextEditors.forEach((editor) => {
            let filePath = editor.document.fileName;
            let ignoreFiles = vscode.workspace.getConfiguration('aider').get('ignoreFiles');
            let shouldIgnore = ignoreFiles.some((regex) => new RegExp(regex).test(filePath));
            if (!shouldIgnore && terminal) {
                terminal.sendText(`/add ${filePath}`);
            }
        });
    }
});

export function activate(context: vscode.ExtensionContext) {
    vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
            let filePath = editor.document.fileName;
            let ignoreFiles = vscode.workspace.getConfiguration('aider').get('ignoreFiles');
            let shouldIgnore = ignoreFiles.some((regex) => new RegExp(regex).test(filePath));
            if (!shouldIgnore && terminal) {
                terminal.sendText(`/add ${filePath}`);
            }
        }
    });

    vscode.workspace.onDidCloseTextDocument((document) => {
        let filePath = document.fileName;
        if (terminal) {
            terminal.sendText(`/drop ${filePath}`);
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
            terminal.sendText(`/add ${filePath}`);
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
            terminal.sendText(`/drop ${filePath}`);
        }
    });
    
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('aider.open', function () {
        // The code you place here will be executed every time your command is executed
        // Show the existing Aider terminal
        if (terminal) {
            terminal.show();
        }
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
