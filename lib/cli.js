#!/usr/bin/env node
const path = require('path'),
  downloadFromPostman = require(`${__dirname}/download.js`),
  exportToPostman = require(`${__dirname}/export_to_postman.js`),
  inspectCollections = require(`${__dirname}/inspect.js`),
  openApiToJsonSchema = require(`${__dirname}/openapi_to_jsonschema.js`),
  uploadToPostman = require(`${__dirname}/upload.js`),
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

      config: pm_config_file
    } = argv;
  try {
    Config =
      Config || (pm_config_file && require(pm_config_file)) || process.env;
    // Remove this attributes since they must be handler internally
    let {
      LIB_FOLDER,
      UTILS_FOLDER,
      injectCollectionScripts,
      ...sanitizedConfig
    } = Config;
    // normalize the configuration object
    Config = require(`${__dirname}/config.js`)(sanitizedConfig, __filename);
    debug({argv, Config});
    if (argv.dump_config) {
      console.log({'using config': sanitizedConfig, received_args: argv});
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
      !pm_swagger
    ) {
      console.log(`
Usage:
  node index.js [action]

  actions:
      - download
      - export (enrich swagger spec with postman endpoints)
      - inspect ()
      - jsonschema
      - upload

      `);

      return;
    }
    debug({'using config': sanitizedConfig, received_args: argv});
    if (pm_download) {
      //console.log(Config);

      await downloadFromPostman(Config, {dryRun: argv.dry_run});
    }
    if (pm_swagger) {
      //console.log(Config);

      await normalizeSwagger(Config, {dryRun: argv.dry_run});
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
