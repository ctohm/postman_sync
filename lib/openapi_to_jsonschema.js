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
      writeJsonIndentation,
    } = require(`${Config.UTILS_FOLDER}/write-json-indentation.js`)(Config),
    $RefParser = require('@apidevtools/json-schema-ref-parser'),
    jsonSchemaToTypeDef = require('@bb-cli/json-schema-to-typedef'),
    toJsonSchema = require('@openapi-contrib/openapi-schema-to-json-schema');
  // OR: toJsonSchema = require('openapi-schema-to-json-schema').fromSchema;

  /* jsonSchema and OpenApi */
  let {
    openApiYamlSpecPath,
    openApiJsonSpecPath,
    jsonSchemaPath,
    jsonSchemaDereferencedPath,
  } = specPaths;

  const openApiSchema = require(openApiJsonSpecPath);

  async function convertir(mySchema) {
    try {
      let convertedSchema = toJsonSchema(mySchema);
      debug(`writing  convertedSchema to ${jsonSchemaPath}`);
      await writeJsonIndentation(jsonSchemaPath, convertedSchema);

      let dereferencedSchema = await $RefParser.dereference(convertedSchema);

      //debug(dereferencedSchema);
      debug(`writing  dereferencedSchema to ${jsonSchemaDereferencedPath}`);

      await writeJsonIndentation(
        jsonSchemaDereferencedPath,
        dereferencedSchema
      );

      let typeDefs = {};

      for (let [modelName, modelDef] of Object.entries(
        dereferencedSchema.components.schemas
      )) {
        typeDefs[modelName] = await jsonSchemaToTypeDef.default(
          modelDef,
          modelName
        );
        typeDefs[modelName] = ['/**']
          .concat(
            typeDefs[modelName].map((props) => {
              return props.split('\n').map((line) => {
                return '* ' + line.trim();
              });
            })
          )
          .concat(['*/']);
      }
      await writeJsonIndentation(
        jsonSchemaPath.replace('.json', '-typedefs.json'),
        typeDefs
      );

      return dereferencedSchema;
    } catch (err) {
      console.error(err);
    }
  }
  return convertir(openApiSchema);
}
//writeJsonIndentation(jsonSchemaPath, convertedSchema).then(async () => {});

if (require.main === module) {
  openApiToJsonSchema(require(`${__dirname}/config.js`)(process.env));
  //  reduceCollections();
}
module.exports = openApiToJsonSchema;
