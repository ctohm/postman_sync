//10: if (process.env.DOTENV_CONFIG_PATH != null) {if

const path = require('path'),
  downloadPostman = require(path.resolve(`${__dirname}/lib/download.js`)),
  exportToPostman = require(path.resolve(
    `${__dirname}/lib/export_to_postman.js`
  )),
  inspectCollections = require(path.resolve(`${__dirname}/lib/inspect.js`)),
  openApiToJsonSchema = require(path.resolve(
    `${__dirname}/lib/openapi_to_jsonschema.js`
  )),
  uploadToPostman = require(path.resolve(`${__dirname}/lib/upload.js`));

exports.downloadPostman = downloadPostman;
exports.exportToPostman = exportToPostman;
exports.inspectCollections = inspectCollections;
exports.uploadToPostman = uploadToPostman;
exports.openApiToJsonSchema = openApiToJsonSchema;

if (require.main === module) {
  let task = process.argv.slice(2),
    env_file =
      process.env.DOTENV_CONFIG_PATH || path.resolve(`${__dirname}/.env`),
    dtnv = require('dotenv').config({
      path: env_file,
      silent: false
    });

  const argv = require('minimist')(process.argv.slice(2)),
    Config = require(path.resolve(`${__dirname}/lib/config.js`))(process.env);
  (async () => {
    console.log({argv, dtnv});
    let {
      download: pm_download = argv._.includes('download'),
      export: pm_export = argv._.includes('export'),
      inspect: pm_inspect = argv._.includes('inspect'),
      jsonschema: pm_jsonschema = argv._.includes('jsonschema'),
      upload: pm_upload = argv._.includes('upload')
    } = argv;
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

    if (pm_download) {
      await downloadPostman(Config);
    }
    if (pm_export) {
      await exportToPostman(Config);
    }
    if (pm_inspect) {
      await inspectCollections(Config);
    }
    if (pm_jsonschema) {
      await openApiToJsonSchema(Config);
    }
    if (pm_upload) {
      await uploadToPostman(Config);
    }
  })()
    .then(res => {
      console.log(res);
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
