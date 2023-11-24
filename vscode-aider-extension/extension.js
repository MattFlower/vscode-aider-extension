const vscode = require('vscode');

const { exec } = require('child_process');
let aiderProcess = null;

function activate(context) {
    vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
            let filePath = editor.document.fileName;
            if (aiderProcess) {
                aiderProcess.stdin.write(`/add ${filePath}\n`);
            }
        }
    });

    vscode.workspace.onDidCloseTextDocument((document) => {
        let filePath = document.fileName;
        if (aiderProcess) {
            aiderProcess.stdin.write(`/drop ${filePath}\n`);
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
        if (aiderProcess) {
            aiderProcess.stdin.write(`/add ${filePath}\n`);
        }
    });

    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('aider.drop', function () {
        // The code you place here will be executed every time your command is executed
        // TODO: Implement drop functionality
    });

    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('aider.open', function () {
        // The code you place here will be executed every time your command is executed
        // Start the Aider process
        aiderProcess = exec('aider');
    });

    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('aider.close', function () {
        // The code you place here will be executed every time your command is executed
        // Terminate the Aider process
        if (aiderProcess) {
            aiderProcess.kill();
            aiderProcess = null;
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
