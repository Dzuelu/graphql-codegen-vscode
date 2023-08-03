import * as vscode from 'vscode';
import { pluginId } from './constants';

export class ExtensionSettings {
  private static configuration = vscode.workspace.getConfiguration(pluginId);

  private constructor() {}

  public static fileExtensionsContainingGraphQLDocuments(): string[] {
    return this.configuration.get('fileExtensionsDeclaringGraphQLDocuments', ['graphql', 'gql']);
  }

  public static filePathToWatch(): string | null {
    return this.configuration.get('filePathToWatch', null);
  }

  public static userConfigPath(): string | null {
    return this.configuration.get('configFilePath', null);
  }
}
