#!/usr/bin/env node
const path = require('path'),
  downloadFromPostman = require(`./download.js`),
  generateTypes = require(`./dtsgen.js`),
  exportToPostman = require(`./export_to_postman.js`),
  inspectCollections = require(`./inspect.js`),
  openApiToJsonSchema = require(`./openapi_to_jsonschema.js`),
  uploadToPostman = require(`./upload.js`),
  createConfig = require(`./config.js`),
  exampleConfig = require(`${__dirname}/../config.example.json`),
  fs = require('fs'),
  this_script = path.basename(__filename, path.extname(__filename));

let debug = require('debug')(`pm_sync:${this_script}`),
  dtsgen = require('./dtsgen'),
  normalizeSwagger = require(path.resolve(`${__dirname}/normalize_swagger`));

const yargs = require('yargs/yargs');
const {hideBin} = require('yargs/helpers');
const {version} = require('yargs');

const pkgInfo = require(`${__dirname}/../package.json`);

async function pmSyncCli(settings = {}) {
  try {
    let {Config, argv, commands} = parseArgs(),
      {
        pm_download = false,
        pm_export = false,
        pm_inspect = false,
        pm_jsonschema = false,
        pm_upload = false,
        pm_swagger = false,
        pm_dtsgen = false,
      } = commands;
    Config = {...settings, ...Config};
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
        argv,
      });
      //fs.writeFileSync(        `${argv.output_folder}/config.json`,        JSON.stringify(Config, null, 4)      );
      //console.log(Config);
      return;
    }

    // normalize the configuration object
    const effectiveConfig = createConfig(sanitizedConfig, 'pmSyncCli');

    const specPaths = require(`${effectiveConfig.UTILS_FOLDER}/get_spec_paths.js`)(
        effectiveConfig
      ),
      {
        openApiJsonSpecPath = `${effectiveConfig.OUTPUT_FOLDER}/specs/openapi/openapi-spec.json`,
        outputTypesPathTsFromOpenapi = `${effectiveConfig.OUTPUT_FOLDER}/types/dtsgen.from.openapi.d.ts`,
      } = specPaths;

    if (pm_download) {
      //console.log(effectiveConfig);

      await downloadFromPostman(effectiveConfig, {dryRun: argv.dry_run});
    }
    if (pm_swagger) {
      const extension = path.extname(argv.input_file);
      if (!extension.endsWith('json')) {
        console.error('path must be a json file ');
        process.exit(1);
      }
      const swaggerFile = path.resolve(argv.input_file),
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
      injectCollectionScripts =
        Config.injectCollectionScripts ||
        (argv.dry_run && require('./utils/inject_collection_scripts'));

      await uploadToPostman(
        {...effectiveConfig, injectCollectionScripts},
        {dryRun: argv.dry_run, snapshotFile: argv.snapshot}
      );
    }
    return;
  } catch (err) {
    console.error(err);
    throw err;
  }
}
function parseArgs() {
  const fs = require('fs');
  //fs.writeFileSync(`pm_sync.config.example.json`, JSON.stringify(exampleConfig);
  var yargv = require('yargs/yargs')(process.argv.slice(2))
    .usage('Usage: $0 <cmd> [options]') // usage string of application.
    .version(pkgInfo.version)
    .option('dump_config', {
      alias: 'u',
      type: 'boolean',
      description: 'dump config to console',
    })
    .option('dry_run', {
      alias: 'dry',
      description: 'do not really upload to POSTMAN',
      type: 'boolean',
    })
    .string('snapshot')
    .option('config', {description: 'read config from this file', alias: 'c'})
    .option('output_folder', {
      description: 'folder to which results will be exported',
      default: `${process.cwd()}/output`,
    })
    .option('input_file', {
      alias: 'if',
      description:
        'file from which to read (specific meaning depends on the command)',
      default: `${process.cwd()}/output/specs/swagger/swagger-spec.json`,
    })
    .command(
      'dtsgen',
      'generate Typescript type definitions using OpenAPI V3 definition'
    )
    .command(
      'download',
      'download definition from Collection URL set in config'
    )
    .version()
    .command('export', 'merge and export swagger and postman definitions')
    .command(
      'inspect',
      'inspect postman definition, optionally replace pre-request and test scripts '
    )
    .command('jsonschema', 'create jsonschema definitions from openAPI output')
    .command('upload', 'upload definitions to Postman Collection URL')
    .command('swagger', ' normalize swagger spec, output to OpenAPI V3 format')
    .alias({output_folder: 'of'})
    .demandCommand(1).argv;

  let pm_config_file = yargv.config,
    pm_download = yargv._.includes('download'),
    pm_export = yargv._.includes('export'),
    pm_inspect = yargv._.includes('inspect'),
    pm_jsonschema = yargv._.includes('jsonschema'),
    pm_upload = yargv._.includes('upload'),
    pm_swagger = yargv._.includes('swagger'),
    pm_dtsgen = yargv._.includes('dtsgen');
  let {_, u, c, config, dump_config, ...argv} = yargv;

  let Config = exampleConfig;
  //argv.configPath = `${__dirname}/../config.example.json`;
  if (yargv.config) {
    console.log(yargv.config);
    argv.configPath = `${process.cwd()}/${yargv.config}`;
    Config = require(argv.configPath);
  }
  let rawConfig = process.env;
  rawConfig = {...rawConfig, ...Config, ...argv};
  rawConfig = createConfig(rawConfig, 'parseArgs');

  return {
    Config,
    argv: {
      config_path: yargv.config || yargv.c,
      dump_config: yargv.dump_config || yargv.u,
      dry_run: yargv.dry_run,
      snapshot: yargv.snapshot,
      input_file: yargv.input_file,
    },
    commands: {
      pm_download,
      pm_export,
      pm_inspect,
      pm_jsonschema,
      pm_upload,
      pm_swagger,
      pm_dtsgen,
    },
  };
}
module.exports = pmSyncCli;
module.exports.parseArgs = parseArgs;
if (require.main === module) {
  // Just an example to run the module
  let env_file =
      process.env.DOTENV_CONFIG_PATH || path.resolve(`${__dirname}/../.env`),
    dtnv = require('dotenv').config({
      path: env_file,
      silent: false,
    });

  pmSyncCli()
    .then((res) => {
      console.log(res);
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
