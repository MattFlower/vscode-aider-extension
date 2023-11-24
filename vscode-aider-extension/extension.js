const vscode = require('vscode');

function activate(context) {
    let disposable = vscode.commands.registerCommand('aider.add', function () {
        // The code you place here will be executed every time your command is executed
        // TODO: Implement add functionality
    });

    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('aider.drop', function () {
        // The code you place here will be executed every time your command is executed
        // TODO: Implement drop functionality
    });

    context.subscriptions.push(disposable);
}

exports.activate = activate;

function deactivate() {}

module.exports = {
    activate,
    deactivate
}
