

const Uri = {
    file: (fsPath) => {
        return {
            fsPath,
            with: jest.fn(),
            toString: jest.fn()
        };
    }
};

const workspace = {
    getConfiguration: jest.fn(),
    onDidChangeConfiguration: jest.fn(),
    workspaceFolders: [],
    textDocuments: [],
    onDidOpenTextDocument: jest.fn(),
    onDidCloseTextDocument: jest.fn(),
};

const window = {
    showErrorMessage: jest.fn(),
    showQuickPick: jest.fn(),
    showOpenDialog: jest.fn(),
    activeTextEditor: null,
};

const vscode = {
    Uri,
    workspace,
    window,
    commands: {
        registerCommand: jest.fn()
    },
    ExtensionContext: jest.fn(),
};

module.exports = vscode;

module.exports = vscode;
