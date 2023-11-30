"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const extension_1 = require("../src/extension");
const vscode = __importStar(require("vscode"));
//import * as fs from 'fs';
let fs = require('fs');
let path = require('path');
jest.mock('fs');
jest.mock('path');
describe('findWorkingDirectory should support paths from windows and mac', () => {
    it('should find the working directory in windows', async () => {
        const path = 'C:\\Users\\user\\Documents\\project\\src\\';
        const workingDirectory = await (0, extension_1.findWorkingDirectory)(path);
        expect(workingDirectory).toEqual('C:\\Users\\user\\Documents\\project\\src\\');
    });
    it('should find the working directory in mac', async () => {
        const path = '/Users/user/Documents/project/src/';
        const workingDirectory = await (0, extension_1.findWorkingDirectory)(path);
        expect(workingDirectory).toEqual('/Users/user/Documents/project/src/');
    });
});
describe('findWorkspaceDirectory should support a single workspace folder on windows and mac', () => {
    it('should find the .git folder in mac', async () => {
        // Mock the workspaceFolders property
        Object.defineProperty(vscode.workspace, 'workspaceFolders', {
            get: () => [{
                    uri: vscode.Uri.file("/Users/user/Documents/project/src/"),
                    name: "project1",
                    index: 0
                }]
        });
        jest.spyOn(fs, 'statSync').mockReturnValueOnce(undefined).mockReturnValueOnce({});
        jest.replaceProperty(path, 'sep', '/');
        const workingDirectory = await (0, extension_1.findWorkingDirectory)('');
        expect(workingDirectory).toEqual('/Users/user/Documents/project/');
    });
    it('should find the .git folder on windows', async () => {
        // Mock the workspaceFolders property
        Object.defineProperty(vscode.workspace, 'workspaceFolders', {
            get: () => [{
                    uri: vscode.Uri.file("C:\\Users\\user\\Documents\\project\\src\\"),
                    name: "project1",
                    index: 0
                }]
        });
        jest.spyOn(fs, 'statSync').mockReturnValueOnce(undefined).mockReturnValueOnce({});
        jest.replaceProperty(path, 'sep', '\\');
        const workingDirectory = await (0, extension_1.findWorkingDirectory)('');
        expect(workingDirectory).toEqual('C:\\Users\\user\\Documents\\project\\');
    });
});
//# sourceMappingURL=extension.test.js.map