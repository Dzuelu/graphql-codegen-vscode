import type * as graphqlCodegenCli from '@graphql-codegen/cli';
import { Codegen } from './codegen';
import { Logger } from './logger';

export const runCliGenerate = async (ctx: graphqlCodegenCli.CodegenContext, file?: string) => {
  try {
    await Codegen.cli.generate(ctx);

    Logger.info(`graphql codegen ${file ?? ''} successful!`);
  } catch (err) {
    Logger.debug(err);
    if (err.errors?.length) {
      Logger.error(
        `Codegen threw ${err.errors.length} ${err.errors.length === 1 ? 'error' : 'errors'}, first one: ${
          err.errors[0].message
        }`
      );
    } else {
      Logger.error(`Codegen threw error: ${err.message}`);
    }
  }
};
