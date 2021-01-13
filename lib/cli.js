#!/usr/bin/env node
const path = require('path'),
  downloadFromPostman = require(`./download.js`),
  generateTypes = require(`./dtsgen.js`),
  exportToPostman = require(`./export_to_postman.js`),
  inspectCollections = require(`./inspect.js`),
  openApiToJsonSchema = require(`./openapi_to_jsonschema.js`),
  jsonSchemaToJsDocTypeDef = require('./jsonschema_to_typedefs'),
  uploadToPostman = require(`./upload.js`),
  createConfig = require(`./config.js`),
  pickWhitelistedConfigKeys = require(`./config.js`).pickWhitelistedConfigKeys,
  exampleConfig = require(`${__dirname}/../config.example.json`),
  fs = require('fs'),
  this_script = path.basename(__filename, path.extname(__filename));

let debug = require('debug')(`pm_sync:${this_script}`),
  normalizeSwagger = require(`${__dirname}/normalize_swagger`);

const yargs = require('yargs/yargs');
const {hideBin} = require('yargs/helpers');
const {version} = require('yargs');
const {args} = require('commander');

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
        pm_typedefs = false,
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

    // normalize the configuration object
    const effectiveConfig = createConfig(sanitizedConfig, 'pmSyncCli');

    const specPaths = require(`${effectiveConfig.UTILS_FOLDER}/get_spec_paths.js`)(
      effectiveConfig
    );

    if (argv.dump_config) {
      console.log({
        'using config': sanitizedConfig,
        argv,
      });
      //fs.writeFileSync(        `${argv.output_folder}/config.json`,        JSON.stringify(Config, null, 4)      );
      //console.log(Config);
      return;
    }
    if (pm_download) {
      //console.log(effectiveConfig);

      await downloadFromPostman(effectiveConfig, {dryRun: argv.dry_run});
    }
    if (pm_swagger) {
      let swaggerObject = require(path.resolve(
        `${process.cwd()}/${argv.input_file}`
      ));

      await normalizeSwagger(effectiveConfig, {dryRun: argv.dry_run})({
        swaggerObject,
      });
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
    if (pm_typedefs) {
      await jsonSchemaToJsDocTypeDef(effectiveConfig, {dryRun: argv.dry_run});
    }
    if (pm_dtsgen) {
      await generateTypes({
        openApiSrc: argv.input_file,
        outputFile: argv.output_file,
      });
    }
    if (pm_upload) {
      injectCollectionScripts =
        Config.injectCollectionScripts ||
        (argv.dry_run && require('./utils/inject_collection_scripts'));

      await uploadToPostman(
        {...effectiveConfig, injectCollectionScripts},
        {
          dryRun: argv.dry_run,
          snapshotFile: argv.output_file,
          //  sourceSpecfile: argv.input_file,
        }
      );
    }
    return;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

function configMiddleware(middlewareArgv) {
  let Config = exampleConfig;
  let rawConfig = pickWhitelistedConfigKeys(process.env);

  if (middlewareArgv.config) {
    middlewareArgv.configPath = `${process.cwd()}/${middlewareArgv.config}`;
    Config = require(middlewareArgv.configPath);
  }
  rawConfig = {...rawConfig, ...Config, ...middlewareArgv};

  return createConfig(rawConfig, 'configMiddleware');
}

function parseArgs() {
  var yargv = require('yargs/yargs')(process.argv.slice(2))
    .usage('Usage: $0 <cmd> [options]') // usage string of application.
    .version(pkgInfo.version)
    .option('dump_config', {
      alias: 'u',
      type: 'boolean',
      description: 'dump config to console',
    })

    .option('config', {description: 'read config from this file', alias: 'c'})
    .middleware(configMiddleware)
    .option('output_folder', {
      description: 'folder to which results will be exported',
      default: `${process.cwd()}/output`,
    })

    .command(
      'dtsgen',
      'generate Typescript type definitions using OpenAPI V3 definition',
      (y) => {
        return y
          .option('output_file', {
            description: 'file to output results, details vary with commands',
            // default: `${process.cwd()}/output/output_file.json`,
          })
          .option('input_file', {
            alias: 'if',
            description:
              'file from which to read (specific meaning depends on the command)',
            //default: `${process.cwd()}/output/specs/openapi/openapi-spec.json`,
          });
      },
      (argv) => {
        let openApiAndJsonSchemaPaths = require(`./utils/get_spec_paths.js`).getOpenApiAndJsonSchemaPaths(
          argv
        );

        argv.input_file =
          argv.input_file ||
          openApiAndJsonSchemaPaths.openApiJsonSpecPath ||
          `${argv.output_folder}/specs/openapi/openapi-spec.json`;
        argv.output_file =
          argv.output_file ||
          openApiAndJsonSchemaPaths.outputTypesPathTsFromOpenapi ||
          `${argv.output_folder}/types/dtsgen.from.openapi.d.ts`;
      }
    )
    .command(
      'typedefs',
      'generate jsdoc typedefs from jsonSchema. Remember to generate them, e.g. with pmSync jsonschema'
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
    .command(
      'upload',
      'upload definitions to Postman Collection URL',
      (y) => {
        y.option('output_file', {
          description:
            'path to save a snapshot of the spec that will be uploaded',
        })
          .option('input_file', {
            description: 'source spec to upload',
          })
          .option('dry_run', {
            alias: 'dry',
            description: 'do not really upload to POSTMAN',
            type: 'boolean',
          });
      },
      (argv) => {
        let postmanSpecPaths = require(`./utils/get_spec_paths.js`).getPostmanSpecPaths(
          argv
        );

        argv.input_file =
          argv.input_file ||
          postmanSpecPaths.postmanConvertedPath ||
          postmanSpecPaths.postmanForUploadPath;
        argv.output_file =
          argv.output_file || postmanSpecPaths.postmanAssimilatedPath;
      }
    )
    .command(
      'swagger',
      ' normalize swagger spec, output to OpenAPI V3 format',
      (y) => {
        y.option('input_file', {
          description: 'source spec to upload',
        });
      },
      (argv) => {
        const extension = path.extname(argv.input_file);
        if (!extension.endsWith('json')) {
          console.error('path must be a json file ');
          process.exit(1);
        }
        const swaggerFile = path.resolve(`${process.cwd()}/${argv.input_file}`),
          exists = fs.existsSync(swaggerFile);
        if (!exists) {
          console.error('path does not exist: ', swaggerFile);
          process.exit(1);
        }
        console.log({argv, swaggerFile});
      }
    )
    .alias({output_folder: 'of'})
    .demandCommand(1).argv;

  let pm_config_file = yargv.config,
    pm_download = yargv._.includes('download'),
    pm_export = yargv._.includes('export'),
    pm_inspect = yargv._.includes('inspect'),
    pm_jsonschema = yargv._.includes('jsonschema'),
    pm_upload = yargv._.includes('upload'),
    pm_swagger = yargv._.includes('swagger'),
    pm_typedefs = yargv._.includes('typedefs'),
    pm_dtsgen = yargv._.includes('dtsgen');

  let {_, u, c, config, dump_config, ...argv} = yargv;

  let rawConfig = createConfig(yargv, 'parseArgs');

  return {
    Config: rawConfig,
    argv: {
      config_path: yargv.config || yargv.c,
      dump_config: yargv.dump_config || yargv.u,
      dry_run: yargv.dry_run,
      output_path: yargv.output_path,
      input_file: yargv.input_file,
      output_file: yargv.output_file,
    },
    commands: {
      pm_download,
      pm_export,
      pm_inspect,
      pm_jsonschema,
      pm_upload,
      pm_swagger,
      pm_dtsgen,
      pm_typedefs,
    },
  };
}
module.exports.pmSyncCli = pmSyncCli;
module.exports.normalizeSwagger = normalizeSwagger;
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
