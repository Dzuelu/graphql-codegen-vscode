import type * as graphqlCodegenCli from '@graphql-codegen/cli';
import * as path from 'path';
import { firstWorkspaceDirectory } from './utils';
import { Logger } from './logger';

export class Codegen {
  /**
   * Repo's graphql-codegen/cli package if valid. Check with isValid() or tryInit() first
   */
  public static cli: typeof graphqlCodegenCli;

  private constructor() {}

  public static deactivate(): void {
    Codegen.cli = null as never;
  }

  public static isValid(): boolean {
    return Codegen.cli != null;
  }

  public static tryInit(): boolean {
    if (!this.isValid()) {
      Codegen.cli = require(path.join(firstWorkspaceDirectory(), '/node_modules/@graphql-codegen/cli'));
      Logger.debug(`Attempted @graphql-codegen/cli required with isValid status: ${this.isValid()}`);
    }
    return this.isValid();
  }
}
