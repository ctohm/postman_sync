const path = require('path'),
  downloadPostman = require(path.resolve(`${__dirname}/lib/download.js`)),
  exportToPostman = require(path.resolve(
    `${__dirname}/lib/export_to_postman.js`
  )),
  inspectCollections = require(path.resolve(`${__dirname}/lib/inspect.js`)),
  openApiToJsonSchema = require(path.resolve(
    `${__dirname}/lib/openapi_to_jsonschema.js`
  )),
  uploadToPostman = require(path.resolve(`${__dirname}/lib/upload.js`)),
  pmSyncCli = require(`${__dirname}/lib/cli.js`);

exports.downloadPostman = downloadPostman;
exports.exportToPostman = exportToPostman;
exports.inspectCollections = inspectCollections;
exports.uploadToPostman = uploadToPostman;
exports.openApiToJsonSchema = openApiToJsonSchema;

module.exports = pmSyncCli;

if (require.main === module) {
  // Just an example to run the module
  let env_file =
      process.env.DOTENV_CONFIG_PATH || path.resolve(`${__dirname}/.env`),
    dtnv = require('dotenv').config({
      path: env_file,
      silent: false
    }),
    pkgVersion = require(`${__dirname}/package.json`),
    Config = require(path.resolve(`${__dirname}/lib/config.js`))(
      process.env,
      pkgVersion.version
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
