import * as vscode from 'vscode';


export interface AiderInterface {
    addFile(filePath: string) : void;
    dispose() : void;
    dropFile(filePath: string) : void;
    isWorkspaceFile(filePath: string) : boolean;
    sendCommand(command: string) : void;    
    show(): void;
}

export class AiderTerminal implements AiderInterface {
    _terminal: vscode.Terminal;
    _workingDirectory: string = '';
    _onDidCloseTerminal: () => void;

    constructor(openaiAPIKey: string | null | undefined, aiderCommand: string, onDidCloseTerminal: () => void, workingDirectory: string) {
        this._workingDirectory = workingDirectory;

        let opts;
        if (openaiAPIKey) {
        opts = {
                'name': "Aider",
                'shellPath': "/bin/bash",
                'cwd': this._workingDirectory,
                'env': {
                    "OPENAI_API_KEY": openaiAPIKey
                },
            };
        } else {
            opts = {
                'name': "Aider",
                'cwd': this._workingDirectory,
                'shellPath': "/bin/bash",
            };
        }

        this._terminal = vscode.window.createTerminal(opts);

        this._onDidCloseTerminal = onDidCloseTerminal;
        vscode.window.onDidCloseTerminal((closedTerminal) => {
            if (closedTerminal === this._terminal) {
                this._onDidCloseTerminal();
            }
        });

        this._terminal.show();
        this._terminal.sendText(aiderCommand);
    }

    private getRelativeDirectory(filePath: string) {
        if (!this._workingDirectory) {
            return filePath;
        }

        return filePath.substring(this._workingDirectory.length);
    }

    addFile(filePath: string) : void {
        this._terminal.sendText(`/add ${this.getRelativeDirectory(filePath)}`);
    }

    dropFile(filePath: string) : void {
        this._terminal.sendText(`/drop ${this.getRelativeDirectory(filePath)}`);
    }

    dispose() : void {
        this._terminal.sendText("/exit");
        this._terminal.dispose();
    }

    isWorkspaceFile(filePath: string) : boolean {
        return filePath.startsWith(this._workingDirectory);
    }

    sendCommand(command: string) : void {
        this._terminal.sendText(command);
    }

    show(): void {
        this._terminal.show();
    }
}

