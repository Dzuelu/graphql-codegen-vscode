import * as vscode from 'vscode';
import { pluginDisplayName } from './constants';

export class Logger {
  private static output = vscode.window.createOutputChannel(pluginDisplayName);

  private constructor() {}

  private static timestampMessage(message: string): void {
    this.output.appendLine(`${new Date(Date.now()).toISOString()}: ${message}`);
  }

  public static error(message: string): void {
    vscode.window.showErrorMessage(message);
    this.timestampMessage(message);
  }

  public static warn(message: string): void {
    vscode.window.showWarningMessage(message);
    this.timestampMessage(message);
  }

  public static info(message: string): void {
    vscode.window.showInformationMessage(message);
    this.timestampMessage(message);
  }

  public static debug(message: string): void {
    this.timestampMessage(message);
  }
}
