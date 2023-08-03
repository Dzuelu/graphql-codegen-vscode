import * as vscode from 'vscode';
import type * as graphqlCodegenCli from '@graphql-codegen/cli';
import type { YamlCliFlags } from '@graphql-codegen/cli';
import multimatch from 'multimatch';
import { ExtensionSettings } from './extensionSettings';
import { Logger } from './logger';
import { globby } from 'globby';
import path from 'path';
import { makePathAbsolute, firstWorkspaceDirectory } from './utils';
import { Codegen } from './codegen';
import { runCliGenerate } from './runCliGenerate';

const shouldRunGQLCodegenOnFile = (filePath: string): boolean => {
  const filePathToWatch = ExtensionSettings.filePathToWatch();
  const fileMatchesExtensions = ExtensionSettings.fileExtensionsContainingGraphQLDocuments().some(ext =>
    filePath.endsWith(ext)
  );
  const fileInPathToWatch = filePathToWatch == null || multimatch(filePath, filePathToWatch).length > 0;

  return fileMatchesExtensions && fileInPathToWatch;
};

const getConfigPath = async () => {
  const userConfigPath = ExtensionSettings.userConfigPath();

  if (userConfigPath) {
    return makePathAbsolute(userConfigPath);
  }

  const foundConfigs = await globby(Codegen.cli.generateSearchPlaces('codegen'), {
    cwd: firstWorkspaceDirectory()
  });

  return path.join(firstWorkspaceDirectory(), foundConfigs[0]);
};

// TODO figure out why we're getting Activating extension 'GraphQL.vscode-graphql-execution' failed: Cannot find module 'graphql-config'
// Require stack:
// - /home/capaj/.vscode/extensions/graphql.vscode-graphql-execution-0.1.7/dist/providers/exec-content.js
// - /home/capaj/.vscode/extensions/graphql.vscode-graphql-execution-0.1.7/dist/extension.js
// it does not seem to affect anything, just annoying spam in the console, generation works fine
export function activate(context: vscode.ExtensionContext) {
  let cachedCtx: graphqlCodegenCli.CodegenContext | null = null;
  // let originalGenerates: Record<string, unknown> | null = null;

  const getCodegenContextForVSCode = async () => {
    if (cachedCtx) {
      return cachedCtx;
    }

    try {
      const configFilePath = await getConfigPath();

      cachedCtx = await Codegen.cli.createContext({ config: configFilePath } as YamlCliFlags);
      cachedCtx.cwd = firstWorkspaceDirectory();

      const config = cachedCtx.getConfig();
      if (!config) {
        return;
      }

      // if (config.schema) {
      //   // typically on a config for a single codegen artefact0
      //   config.schema = makePathAbsoluteInSchema(config.schema);
      // }

      // const generates = config.generates;
      // if (generates) {
      //   originalGenerates = cloneDeep(generates);
      //   const generatesWithAllAbsolutePaths: Record<string, any> = {};
      //   // typically on a config for a codegen with multiple artifacts
      //   for (const codegenGenerateOutput of Object.keys(generates)) {
      //     const codegenGenerate = generates[codegenGenerateOutput] as any; // as Types.ConfiguredOutput

      //     if (codegenGenerate.schema) {
      //       codegenGenerate.schema = makePathAbsoluteInSchema(codegenGenerate.schema);
      //     }
      //     if (
      //       codegenGenerate.preset &&
      //       typeof codegenGenerate.preset === 'string' &&
      //       codegenGenerate.preset.includes('near-operation-file') &&
      //       !codegenGenerate.presetConfig?.cwd
      //     ) {
      //       if (!codegenGenerate.presetConfig) {
      //         codegenGenerate.presetConfig = {};
      //       }
      //       codegenGenerate.presetConfig.cwd = firstWorkspaceDirectory();
      //     }

      //     codegenGenerate.originalOutputPath = codegenGenerateOutput;
      //     generatesWithAllAbsolutePaths[
      //       makePathAbsolute(codegenGenerateOutput) // this is only needed for windows. Not sure why, but it works fine on linux even when these paths are relative
      //     ] = codegenGenerate;
      //   }
      //   config.generates = generatesWithAllAbsolutePaths;
      // }

      // cachedCtx.updateConfig(config);

      // // console.log('cached ctx', cachedCtx)

      return cachedCtx;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  vscode.workspace.onDidSaveTextDocument(async (document: vscode.TextDocument) => {
    if (shouldRunGQLCodegenOnFile(document.fileName)) {
      // require the package lazily as late as possible-makes it possible
      // to install the deps and get the generation working right away
      if (!Codegen.tryInit()) {
        Logger.error('Failed to find @graphql-codegen/cli package');
        return;
      }

      const ctx = await getCodegenContextForVSCode();
      if (!ctx) {
        return;
      }

      // const config = ctx.getConfig();
      // if (!config) {
      //   return;
      // }
      // if (config.schema) {
      //   config.documents = document.fileName;
      // } else {
      //   const { generates } = config;

      //   for (const codegenGenerateOutput of Object.keys(generates)) {
      //     const codegenGenerate = generates[codegenGenerateOutput] as any; // as Types.ConfiguredOutput

      //     const matches = multimatch(
      //       document.fileName.replace(`${firstWorkspaceDirectory()}/`, ''),
      //       // @ts-expect-error
      //       originalGenerates[codegenGenerate.originalOutputPath].documents
      //     );

      //     if (matches.length === 0) {
      //       // this file does not match the glob. This will not generate so we can omit this
      //       codegenGenerate.documents = [];
      //     } else {
      //       codegenGenerate.documents = document.fileName;
      //     }
      //   }
      // }

      // ctx.updateConfig(config);

      await runCliGenerate(ctx, document.fileName);
    }
    // const customConfig = customExtensionConfig()
  });

  const disposable = vscode.commands.registerCommand('graphql-codegen.generateGqlCodegen', async () => {
    if (!Codegen.tryInit()) {
      Logger.error('Failed to find @graphql-codegen/cli package');
      return;
    }

    const ctx = await getCodegenContextForVSCode();
    if (!ctx) {
      return;
    }

    // const config = ctx.getConfig();
    // if (!config) {
    //   vscode.window.showWarningMessage(`could not find @graphql-codegen/cli config`);
    //   return;
    // }

    // config.documents = makePathOrPathArrayAbsolute(config.documents as string[]);

    // ctx.updateConfig(config);

    await runCliGenerate(ctx);
  });
  context.subscriptions.push(disposable);
}

export function deactivate() {
  Codegen.deactivate();
}
