#!/usr/bin/env node
async function openApiToJsonSchema(Config) {
  // normalize the configuration object
  Config = require(`${__dirname}/config.js`)(Config);
  const Promise = require('bluebird'),
    _ = require('lodash'),
    fs = Promise.promisifyAll(require('fs')),
    path = require('path'),
    specPaths = require(`${Config.UTILS_FOLDER}/get_spec_paths.js`)(Config),
    this_script = path.basename(__filename, path.extname(__filename)),
    debug = require('debug')(`pm_sync:${this_script}`),
    chalk = require('chalk'),
    {
      indentationReplacer,
      writeJsonIndentation
    } = require(`${Config.UTILS_FOLDER}/write-json-indentation.js`)(Config),
    $RefParser = require('json-schema-ref-parser'),
    toJsonSchema = require('openapi-schema-to-json-schema');
  // OR: toJsonSchema = require('openapi-schema-to-json-schema').fromSchema;

  /* jsonSchema and OpenApi */
  let {
      openApiYamlSpecPath,
      openApiJsonSpecPath,
      jsonSchemaPath,
      jsonSchemaDereferencedPath
    } = specPaths,
    openApiSchema = require(openApiJsonSpecPath);

  async function convertir(mySchema) {
    try {
      let dereferencedSchema = await $RefParser.dereference(mySchema);

      debug(dereferencedSchema);
      await writeJsonIndentation(
        jsonSchemaDereferencedPath,
        dereferencedSchema
      );

      let convertedSchema = toJsonSchema(dereferencedSchema);
      await writeJsonIndentation(jsonSchemaPath, convertedSchema);
      debug('finished');
    } catch (err) {
      console.error(err);
    }
  }
}
//writeJsonIndentation(jsonSchemaPath, convertedSchema).then(async () => {});

if (require.main === module) {
  openApiToJsonSchema(require(`${__dirname}/config.js`)(process.env));
  //  reduceCollections();
}
module.exports = openApiToJsonSchema;
