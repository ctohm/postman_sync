#!/usr/bin/node
const path = require('path'),
  downloadPostman = require(`${__dirname}/download.js`),
  exportToPostman = require(`${__dirname}/export_to_postman.js`),
  inspectCollections = require(`${__dirname}/inspect.js`),
  openApiToJsonSchema = require(`${__dirname}/openapi_to_jsonschema.js`),
  uploadToPostman = require(`${__dirname}/upload.js`);

async function pmSyncCli(Config) {
  Config = require(`${__dirname}/config.js`)(Config);
  const argv = require('minimist')(process.argv.slice(2)),
    {
      download: pm_download = argv._.includes('download'),
      export: pm_export = argv._.includes('export'),
      inspect: pm_inspect = argv._.includes('inspect'),
      jsonschema: pm_jsonschema = argv._.includes('jsonschema'),
      upload: pm_upload = argv._.includes('upload'),
      config: pm_config_file
    } = argv;
  try {
    Config =
      Config || (pm_config_file && require(pm_config_file)) || process.env;
    // normalize the configuration object
    console.log({argv});
    if (argv.dump_config) {
      console.log(Config);
      return;
    }
    let fs = require('fs');
    fs.writeFileSync('config.json', JSON.stringify(Config, null, 4));
    if (
      !pm_download &&
      !pm_export &&
      !pm_inspect &&
      !pm_jsonschema &&
      !pm_upload
    ) {
      console.log(` 
Usage:
  node index.js [action]

  actions:
      - download 
      - inspect 
      - jsonschema 
      - upload

      `);

      return;
    }

    Config = require(`${__dirname}/config.js`)(Config);
    if (pm_download) {
      await downloadPostman(Config, {dryRun: argv.dry_run});
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
      await uploadToPostman(Config, {dryRun: argv.dry_run});
    }
    process.exit(1);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
module.exports = pmSyncCli;
