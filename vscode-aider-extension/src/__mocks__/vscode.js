

const workspace = {
    getConfiguration: jest.fn(),
    onDidChangeConfiguration: jest.fn(),
    workspaceFolders: new Array([]),
};

const vscode = {
    workspace,
}

module.exports = vscode;