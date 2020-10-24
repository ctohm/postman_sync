#!/usr/bin/env node
const path = require('path'),
  downloadFromPostman = require(`${__dirname}/download.js`),
  exportToPostman = require(`${__dirname}/export_to_postman.js`),
  inspectCollections = require(`${__dirname}/inspect.js`),
  openApiToJsonSchema = require(`${__dirname}/openapi_to_jsonschema.js`),
  uploadToPostman = require(`${__dirname}/upload.js`),
  generateTypes=require('./dtsgen'),
  normalizeSwagger = require(path.resolve(`${__dirname}/normalize_swagger`));
async function pmSyncCli(Config) {
  const this_script = path.basename(__filename, path.extname(__filename)),
    debug = require('debug')(`pm_sync:${this_script}`),
    argv = require('minimist')(process.argv.slice(2)),
    {
      download: pm_download = argv._.includes('download'),
      export: pm_export = argv._.includes('export'),
      inspect: pm_inspect = argv._.includes('inspect'),
      jsonschema: pm_jsonschema = argv._.includes('jsonschema'),
      upload: pm_upload = argv._.includes('upload'),
      swagger: pm_swagger = argv._.includes('swagger'),
      dtsgen:pm_dtsgen=argv._.includes('dtsgen'),

      config: pm_config_file,
    } = argv;
    try {
      Config =
      Config || (pm_config_file && require(pm_config_file)) || process.env;
      // Remove this attributes since they must be handler internally
      Config.OUTPUT_FOLDER=argv.of||argv.output_folder||Config.OUTPUT_FOLDER;
     let {
      LIB_FOLDER,
      UTILS_FOLDER,
      injectCollectionScripts,
      ...sanitizedConfig
    } = Config;

    // normalize the configuration object
    Config = require(`${__dirname}/config.js`)(sanitizedConfig, __filename);
     if (argv.dump_config) {
      console.log({'using config': sanitizedConfig, pm_config_file,received_args: argv});
      //console.log(Config);
      return;
    }
    let fs = require('fs');
    fs.writeFileSync('config.json', JSON.stringify(Config, null, 4));
    if (
      !pm_download &&
      !pm_export &&
      !pm_inspect &&
      !pm_jsonschema &&
      !pm_upload &&
      !pm_swagger &&
      !pm_dtsgen
    ) {
      console.log(`
Usage:
  node index.js [action]

  actions:
      - download
      - export (enrich swagger spec with postman endpoints)
      - inspect ()
      - jsonschema
      - dtsgen
      - upload

      `);

      return;
    }
   const specPaths = require(`${Config.UTILS_FOLDER}/get_spec_paths.js`)(Config),
      {
      openApiJsonSpecPath=`${Config.OUTPUT_FOLDER}/specs/openapi/openapi-spec.json`,
      outputTypesPathTsFromOpenapi=`${Config.OUTPUT_FOLDER}/types/dtsgen.from.openapi.d.ts`,

    } = specPaths;

    debug({'using config': sanitizedConfig, received_args: argv,});
    if (pm_download) {
      //console.log(Config);

      await downloadFromPostman(Config, {dryRun: argv.dry_run});
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

      await normalizeSwagger(Config, {dryRun: argv.dry_run})({swaggerObject});
      console.log({argv, swaggerFile});
    }
    if (pm_export) {
      await exportToPostman(Config, {dryRun: argv.dry_run});
    }
    if (pm_inspect) {
      await inspectCollections(Config, {dryRun: argv.dry_run});
    }
    if (pm_jsonschema) {
      await openApiToJsonSchema(Config, {dryRun: argv.dry_run});
    }
    if(pm_dtsgen) {

      await generateTypes({openApiSrc:openApiJsonSpecPath,outputFile:outputTypesPathTsFromOpenapi});
    }
    if (pm_upload) {
      await uploadToPostman(
        {...Config, injectCollectionScripts},
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
      silent: false
    }),
    pkgVersion = require(`${__dirname}/../package.json`),
    Config = require(path.resolve(`${__dirname}/config.js`))(
      {API_VERSION: pkgVersion.version, ...process.env},
      __filename
    );

  pmSyncCli(Config)
    .then(res => {
      console.log(res);
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
