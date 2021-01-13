#!/usr/bin/env node
async function jsonSchemaToJsDocTypeDef(Config) {
  // normalize the configuration object
  Config = require(`${__dirname}/config.js`)(Config);
  const Promise = require('bluebird'),
    _ = require('lodash'),
    fs = Promise.promisifyAll(require('fs')),
    path = require('path'),
    specPaths = require(`${Config.UTILS_FOLDER}/get_spec_paths.js`)(Config),
    this_script = path.basename(__filename, path.extname(__filename)),
    debug = require('debug')(`pm_sync:${this_script}`),
    generateTypes = require('./dtsgen'),
    {OUTPUT_FOLDER} = Config,
    {
      writeJsonIndentation,
    } = require(`${Config.UTILS_FOLDER}/write-json-indentation.js`)(Config),
    /**
     * @see https://apitools.dev/json-schema-ref-parser/
     */
    $RefParser = require('@apidevtools/json-schema-ref-parser'),
    jsonSchemaToTypeDef = require('@bb-cli/json-schema-to-typedef'),
    /**
     * @see https://www.npmjs.com/package/@openapi-contrib/openapi-schema-to-json-schema
     */
    toJsonSchema = require('@openapi-contrib/openapi-schema-to-json-schema');
  // OR: toJsonSchema = require('openapi-schema-to-json-schema').fromSchema;
  //mixin all the methods into Lodash object
  require('deepdash')(_);
  /* jsonSchema and OpenApi */
  let {
    openApiYamlSpecPath,
    openApiJsonSpecPath,
    jsonSchemaPath,
    jsonSchemaDereferencedPath,
    outputTypesPathTsFromOpenapi = `${OUTPUT_FOLDER}/types/dtsgen.from.openapi.d.ts`,
    outputTypesPathTsFromJsonSchema = `${OUTPUT_FOLDER}/types/dtsgen.from.jsonschema.d.ts`,
    outputTypeDefsPath: outputTypeDefsJSPath = `${OUTPUT_FOLDER}/types/jsonschema.typedefs.js`,
    outputTypeDefsObjectPath: outputTypeDefsJsonPath = `${OUTPUT_FOLDER}/types/jsonschema.typedefs.json`,
  } = specPaths;

  console.log('Reading openApiSchema from ' + openApiJsonSpecPath);
  const dereferencedSchema = require(jsonSchemaDereferencedPath);

  async function generateTypeDefs(dereferencedSchemaObj) {
    let typeDefs = {},
      allTypesArray = [];

    let [schemaName, schemaDef] = Object.entries(
      dereferencedSchemaObj.components
    );
    let componentsSchemas = await jsonSchemaToTypeDef.default(
      {type: 'object', ...schemaDef},
      schemaName
    );

    for (let [modelName, modelDef] of Object.entries(
      dereferencedSchemaObj.components.schemas
    )) {
      typeDefs[modelName] = await jsonSchemaToTypeDef.default(
        {type: 'object', ...modelDef},
        modelName
      );
      typeDefs[modelName] = typeDefs[modelName]
        .reduce((accum, props) => {
          accum = accum.concat(
            props.split('\n').reduce(
              (accum2, line) => {
                accum2.push(' * ' + line.trim());
                return accum2;
              },
              ['/**']
            )
          );
          return accum;
        }, [])
        .concat([' */']);

      allTypesArray = allTypesArray.concat(
        [
          `
        `,
        ],
        typeDefs[modelName],
        [
          `
        `,
        ]
      );
    }

    fs.writeFileSync(
      outputTypeDefsJSPath,
      Object.values(typeDefs)
        .reduce((accum, type) => {
          accum = accum.concat(type);
          accum.push('\n');
          return accum;
        }, [])
        .join('\n')
    );
    await writeJsonIndentation(
      outputTypeDefsJsonPath.replace('.typedefs', '.schemas.typedefs'),
      componentsSchemas
    );
    return writeJsonIndentation(outputTypeDefsJsonPath, typeDefs);
  }

  return generateTypeDefs(dereferencedSchema);
}
//writeJsonIndentation(jsonSchemaPath, convertedSchema).then(async () => {});

if (require.main === module) {
  jsonSchemaToJsDocTypeDef(require(`${__dirname}/config.js`)(process.env));
  //  reduceCollections();
}
module.exports = jsonSchemaToJsDocTypeDef;
