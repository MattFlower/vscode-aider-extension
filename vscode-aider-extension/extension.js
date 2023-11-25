const vscode = require('vscode');

const { exec } = require('child_process');
const terminal = vscode.window.createTerminal('Aider');

function activate(context) {
    vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
            let filePath = editor.document.fileName;
            if (terminal) {
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
        // Start the Aider process
        const terminal = vscode.window.createTerminal('Aider');
        terminal.sendText('aider');
        terminal.show();
    });

    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('aider.close', function () {
        // The code you place here will be executed every time your command is executed
        // Terminate the Aider process
        if (terminal) {
            terminal.kill();
            terminal = null;
        }
    });

    context.subscriptions.push(disposable);
}

exports.activate = activate;

function deactivate() {}

module.exports = {
    activate,
    deactivate
}
