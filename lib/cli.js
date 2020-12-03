#!/usr/bin/env node
const path = require('path'),
  downloadFromPostman = require(`${__dirname}/download.js`),
  exportToPostman = require(`${__dirname}/export_to_postman.js`),
  inspectCollections = require(`${__dirname}/inspect.js`),
  openApiToJsonSchema = require(`${__dirname}/openapi_to_jsonschema.js`),
  uploadToPostman = require(`${__dirname}/upload.js`),
  //  generateTypes = require('./dtsgen'),

  normalizeSwagger = require(path.resolve(`${__dirname}/normalize_swagger`));

const yargs = require('yargs/yargs');
const {hideBin} = require('yargs/helpers');
const {version} = require('yargs');

const pkgInfo = require(`${__dirname}/../package.json`);

async function pmSyncCli(Config) {
  const this_script = path.basename(__filename, path.extname(__filename)),
    debug = require('debug')(`pm_sync:${this_script}`);

  var argv = require('yargs/yargs')(process.argv.slice(2))
    .usage('Usage: $0 <cmd> [options]') // usage string of application.
    .version(pkgInfo.version)
    .option('dump_config', {default: false})
    .config('config', 'read config from this file')
    .default('config', `config.example.json`)

    .option('output_folder', {
      description: 'folder to which results will be exported',
      default: `${process.cwd()}/output`,
    })
    .command(
      'dtsgen',
      'generate Typescript type definitions using OpenAPI V3 definition'
    )
    .command(
      'download',
      'download definition from Collection URL set in config'
    )
    .command('export', 'merge and export swagger and postman definitions')
    .command(
      'inspect',
      'inspect postman definition, optionally replace pre-request and test scripts '
    )
    .command('jsonschema', 'create jsonschema definitions from openAPI output')
    .command('upload', 'upload definitions to Postman Collection URL')
    .command('swagger', ' normalize swagger spec, output to OpenAPI V3 format')
    .alias({config: 'c', output_folder: 'of', dump_config: 'dc'})
    .demandCommand(1).argv;

  let usingConfig = require(path.resolve(argv.config));
  let pm_config_file = argv.config,
    pm_download = argv._.includes('download'),
    pm_export = argv._.includes('export'),
    pm_inspect = argv._.includes('inspect'),
    pm_jsonschema = argv._.includes('jsonschema'),
    pm_upload = argv._.includes('upload'),
    pm_swagger = argv._.includes('swagger'),
    pm_dtsgen = argv._.includes('dtsgen');

  if (argv.config) {
    usingConfig = require(`${process.cwd()}/${argv.config}`);
  }

  try {
    Config = Config || {...process.env, ...usingConfig};

    // Remove this attributes since they must be handler internally
    Config.OUTPUT_FOLDER = argv.output_folder || Config.OUTPUT_FOLDER;
    let {
      LIB_FOLDER,
      UTILS_FOLDER,
      injectCollectionScripts,
      ...sanitizedConfig
    } = Config;

    //

    if (argv.dump_config) {
      console.log({
        'using config': sanitizedConfig,
        pm_config_file,
        received_args: argv,
      });
      fs.writeFileSync(
        `${argv.output_folder}/config.json`,
        JSON.stringify(Config, null, 4)
      );
      //console.log(Config);
      return;
    }

    // normalize the configuration object
    const effectiveConfig = require(`${__dirname}/config.js`)(
      sanitizedConfig,
      __filename
    );

    const specPaths = require(`${effectiveConfig.UTILS_FOLDER}/get_spec_paths.js`)(
        effectiveConfig
      ),
      {
        openApiJsonSpecPath = `${effectiveConfig.OUTPUT_FOLDER}/specs/openapi/openapi-spec.json`,
        outputTypesPathTsFromOpenapi = `${effectiveConfig.OUTPUT_FOLDER}/types/dtsgen.from.openapi.d.ts`,
      } = specPaths;

    debug({'using config': sanitizedConfig, received_args: argv});
    if (pm_download) {
      //console.log(effectiveConfig);

      await downloadFromPostman(effectiveConfig, {dryRun: argv.dry_run});
    }
    if (pm_swagger) {
      const extension = path.extname(argv.swagger);
      if (!extension.endsWith('json')) {
        console.error('path must be a json file ');
        process.exit(1);
      }
      const swaggerFile = path.resolve(argv.swagger),
        exists = fs.existsSync(swaggerFile);
      if (!exists) {
        console.error('path does not exist: ', swaggerFile);
        process.exit(1);
      }
      let swaggerObject = require(swaggerFile);

      await normalizeSwagger(effectiveConfig, {dryRun: argv.dry_run})({
        swaggerObject,
      });
      console.log({argv, swaggerFile});
    }
    if (pm_export) {
      await exportToPostman(effectiveConfig, {dryRun: argv.dry_run});
    }
    if (pm_inspect) {
      await inspectCollections(effectiveConfig, {dryRun: argv.dry_run});
    }
    if (pm_jsonschema) {
      await openApiToJsonSchema(effectiveConfig, {dryRun: argv.dry_run});
    }
    if (pm_dtsgen) {
      await generateTypes({
        openApiSrc: openApiJsonSpecPath,
        outputFile: outputTypesPathTsFromOpenapi,
      });
    }
    if (pm_upload) {
      await uploadToPostman(
        {...effectiveConfig, injectCollectionScripts},
        {dryRun: argv.dry_run}
      );
    }
    return;
  } catch (err) {
    console.error(err);
    throw err;
  }
}
module.exports = pmSyncCli;
if (require.main === module) {
  // Just an example to run the module
  let env_file =
      process.env.DOTENV_CONFIG_PATH || path.resolve(`${__dirname}/../.env`),
    dtnv = require('dotenv').config({
      path: env_file,
      silent: false,
    }),
    Config = null;

  pmSyncCli(Config)
    .then((res) => {
      console.log(res);
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
