import * as vscode from 'vscode';
import fs = require('fs');


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
    _workingDirectory: string;
    _onDidCloseTerminal: () => void;

    constructor(openaiAPIKey: string | null | undefined, aiderCommand: string, onDidCloseTerminal: () => void) {
        // Try to find a good working path, which is harder than it seems
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            let workspaceFolder = vscode.workspace.workspaceFolders[0];
            this._workingDirectory = this.computeWorkingDirectory(workspaceFolder.uri.fsPath);
        } else if (vscode.window.activeTextEditor?.document?.fileName) {
            let filePath = vscode.window.activeTextEditor.document.fileName;
            let components = filePath.split("/")
            components.pop();
            filePath = components.join("/");
            this._workingDirectory = this.computeWorkingDirectory(filePath);
        } else {
            this._workingDirectory = "/";
        }    

        let opts;
        if (openaiAPIKey) {
           opts = {
                'name': "Aider",
                'shellPath': "/bin/bash",
                'env': {
                    "OPENAI_API_KEY": openaiAPIKey
                },
            };
        } else {
            opts = {
                'name': "Aider",
                'shellPath': "/bin/bash",
            };
        }

        this._terminal = vscode.window.createTerminal(opts);
        this._terminal.show();
        this._terminal.sendText(aiderCommand);
        vscode.window.onDidCloseTerminal((closedTerminal) => {
            if (closedTerminal === this._terminal) {
                this._onDidCloseTerminal();
            }
        });
    }

    private computeWorkingDirectory(filePath: string): string {
        let dirs: string[] = filePath.split("/").filter((item) => { return item !== ""});
        while (dirs.length > 0) {
            try {
                let dir = "/" + dirs.join("/") + "/.git"; 
                if (fs.statSync(dir) !== undefined) {
                    return "/" + dirs.join("/") + "/";
                }
            } catch(err) {
                dirs.pop();
            }
        }

        return "/";
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

