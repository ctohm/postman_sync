const path = require('path'),
  downloadFromPostman = require(path.resolve(`${__dirname}/lib/download.js`)),
  exportToPostman = require(path.resolve(
    `${__dirname}/lib/export_to_postman.js`
  )),
  inspectCollections = require(path.resolve(`${__dirname}/lib/inspect.js`)),
  openApiToJsonSchema = require(path.resolve(
    `${__dirname}/lib/openapi_to_jsonschema.js`
  )),
  normalizeSwagger = require(path.resolve(
    `${__dirname}/lib/normalize_swagger`
  )),
  uploadToPostman = require(path.resolve(`${__dirname}/lib/upload.js`)),
  pmSyncCli = require(`${__dirname}/lib/cli.js`);

module.exports = pmSyncCli;
module.exports.normalizeSwagger = normalizeSwagger;
module.exports.downloadFromPostman = downloadFromPostman;
module.exports.exportToPostman = exportToPostman;
module.exports.inspectCollections = inspectCollections;
module.exports.uploadToPostman = uploadToPostman;
module.exports.openApiToJsonSchema = openApiToJsonSchema;

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
