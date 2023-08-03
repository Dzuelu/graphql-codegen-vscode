import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Current workspace directory
 */
export const firstWorkspaceDirectory = (): string => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return vscode.workspace.workspaceFolders![0].uri.fsPath;
};

export const makePathAbsolute = (fsPath: string): string => {
  if (path.isAbsolute(fsPath) || fsPath.startsWith('http')) {
    return fsPath;
  }
  return path.join(firstWorkspaceDirectory(), fsPath);
};
