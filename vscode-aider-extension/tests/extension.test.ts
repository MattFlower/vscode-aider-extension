import { findWorkingDirectory } from '../src/extension';
import * as vscode from 'vscode';


describe('findWorkingDirectory should support paths from windows and mac', () => {
    it('should find the working directory in windows', async () => {
        const path = 'C:\\Users\\user\\Documents\\project\\src\\';
        const workingDirectory = await findWorkingDirectory(path);
        expect(workingDirectory).toEqual('C:\\Users\\user\\Documents\\project\\src\\');
    });

    it('should find the working directory in mac', async () => {
        const path = '/Users/user/Documents/project/src/';
        const workingDirectory = await findWorkingDirectory(path);
        expect(workingDirectory).toEqual('/Users/user/Documents/project/src/');
    }); 
});

describe('findWorkspaceDirectory should support a single workspace folder on windows and mac', () => {
    it ('should find the .git folder in mac', async () => {
        // Mock the workspaceFolders property
        Object.defineProperty(vscode.workspace, 'workspaceFolders', {
            get: () => [{
                uri: vscode.Uri.file("/Users/user/Documents/project/src/"),
                name: "project1",
                index: 0
            }]
        });

        const workingDirectory = await findWorkingDirectory('');
        expect(workingDirectory).toEqual('/Users/user/Documents/project/src/');
    });
});
