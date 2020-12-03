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
function getSpecPaths(Config) {
  Config = require(`${__dirname}/lib/config.js`)(Config, __filename);

  const specPaths = require(`${Config.UTILS_FOLDER}/get_spec_paths.js`)(Config),
    /* Postman Paths */
    {
      swaggerYamlFirstExport,
      swaggerJsonFirstExport,
      postmanIndentedSpecPath,
      postmanSpecPath,
      postmanEnvironmentPath,
    } = specPaths;

  return {postmanSpecPath, postmanEnvironmentPath};
}
module.exports = pmSyncCli;
module.exports.normalizeSwagger = normalizeSwagger;
module.exports.downloadFromPostman = downloadFromPostman;
module.exports.exportToPostman = exportToPostman;
module.exports.inspectCollections = inspectCollections;
module.exports.uploadToPostman = uploadToPostman;
module.exports.openApiToJsonSchema = openApiToJsonSchema;
module.exports.getSpecPaths = getSpecPaths;

if (require.main === module) {
  // Just an example to run the module

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
