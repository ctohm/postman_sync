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
    debug = require('debug')(`pm_syncx:${this_script}`),
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
  } = specPaths;

  console.log('Reading openApiSchema from ' + openApiJsonSpecPath);
  const openApiSchema = require(openApiJsonSpecPath),
    prunedOpenApiSchemaPath = openApiJsonSpecPath.replace(
      'openapi-spec',
      'openapi-schema'
    ),
    {components, paths} = openApiSchema,
    {requestBodies} = components;
  let prunedRequestBodies = _.reduce(
    requestBodies,
    (accum, value, key) => {
      let {content} = value;
      accum[key] = {
        content: {
          'application/json': content['application/json'],
        },
      };
      return accum;
    },
    {}
  );
  let indexPaths = Object.keys(_.index(paths));
  let requestBodiesKeys = _.uniq(
    indexPaths
      .filter((entry) => {
        // e.g. requestBody.content['text/xml']
        return entry.includes('requestBody.content[');
      })
      .map((entry) => {
        return entry.split('.content')[0];
      })
  );
  console.log({
    indexPaths: indexPaths.length,
    requestBodiesKeys: requestBodiesKeys.length,
  });
  let pathContentKeys = _.uniq(
    Object.keys(_.index(paths))
      .filter((entry) => {
        // e.g. responses['200'].content['text/xml']
        return entry.includes('].content[') && entry.includes('responses');
      })
      .map((entry) => {
        return entry.split('.content')[0];
      })
  );
  _.each(requestBodiesKeys, (entry) => {
    let jsonroute = `${entry}.content`,
      jsoncontent = _.get(paths, jsonroute),
      goodcontent = jsoncontent['application/json'];
    _.set(paths, jsonroute, {
      'application/json': goodcontent,
    });
  });
  _.each(pathContentKeys, (entry) => {
    let jsonroute = `${entry}.content`,
      jsoncontent = _.get(paths, jsonroute),
      goodcontent = jsoncontent['application/json'];
    _.set(paths, jsonroute, {
      'application/json': goodcontent,
    });
  });

  let prunedOpenApiSchema = {
    ...openApiSchema,
    paths,
    components: {
      ...components,
      requestBodies: prunedRequestBodies,
    },
  };

  /**
   *
   * @param {import('openapi-types').OpenAPIV3} mySchema
   */
  async function convertir(mySchema) {
    try {
      let dir3upwards = path.dirname(
        path.dirname(path.dirname(path.dirname(jsonSchemaPath)))
      );
      let convertedSchema = toJsonSchema(mySchema);
      debug(
        `writing  convertedSchema to ${jsonSchemaPath.replace(dir3upwards, '')}`
      );

      await writeJsonIndentation(jsonSchemaPath, convertedSchema);

      let dereferencedSchema = await $RefParser.dereference(convertedSchema);

      //debug(dereferencedSchema);
      debug(
        `writing  dereferencedSchema to ${jsonSchemaDereferencedPath.replace(
          dir3upwards,
          ''
        )}`
      );

      // debug({compile, compileFromFile, otherProps});
      await writeJsonIndentation(
        jsonSchemaDereferencedPath,
        dereferencedSchema
      );
      return dereferencedSchema;
    } catch (err) {
      console.error(err);
    }
  }
  return convertir(prunedOpenApiSchema);
}
//writeJsonIndentation(jsonSchemaPath, convertedSchema).then(async () => {});

if (require.main === module) {
  openApiToJsonSchema(require(`${__dirname}/config.js`)(process.env));
  //  reduceCollections();
}
module.exports = openApiToJsonSchema;
