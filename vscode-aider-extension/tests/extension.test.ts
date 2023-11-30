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
        vscode.workspace.workspaceFolders = ["/Users/user/Documents/project/src/"];

        const path = '/Users/user/Documents/project/src/';
        const workingDirectory = await findWorkingDirectory(path);
        expect(workingDirectory).toEqual('/Users/user/Documents/project/src/');
    });
});