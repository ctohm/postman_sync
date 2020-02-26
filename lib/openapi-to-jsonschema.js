#!/usr/bin/env node

const Promise = require('bluebird'),
  _ = require('lodash'),
  fs = Promise.promisifyAll(require('fs')),
  path = require('path'),
  Config = require(`${__dirname}/config.js`),
  specPaths = require(`${process.env.UTILS_FOLDER}/get_spec_paths.js`),
  this_script = path.basename(__filename, path.extname(__filename)),
  debug = require('debug')(`${Config.DEBUG_PREFIX}:docs:${this_script}`),
  chalk = require('chalk'),
  {
    indentationReplacer,
    writeJsonIndentation
  } = require(`${process.env.UTILS_FOLDER}/write-json-indentation.js`),
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
    await writeJsonIndentation(jsonSchemaDereferencedPath, dereferencedSchema);

    let convertedSchema = toJsonSchema(dereferencedSchema);
    await writeJsonIndentation(jsonSchemaPath, convertedSchema);
    debug('finished');
  } catch (err) {
    console.error(err);
  }
}
convertir(openApiSchema);
//writeJsonIndentation(jsonSchemaPath, convertedSchema).then(async () => {});
