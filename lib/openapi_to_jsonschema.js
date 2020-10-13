#!/usr/bin/env node
async function openApiToJsonSchema(Config) {
  // normalize the configuration object
  Config = require(`${__dirname}/config.js`)(Config);
  const Promise = require('bluebird'),
    _ = require('lodash'),
    fs = Promise.promisifyAll(require('fs')),
    path = require('path'),
    specPaths = require(`${Config.UTILS_FOLDER}/get_spec_paths.js`)(Config),
    {
      compile,
      compileFromFile,
      ...otherProps
    } = require('json-schema-to-typescript'),
    this_script = path.basename(__filename, path.extname(__filename)),
    debug = require('debug')(`pm_sync:${this_script}`),
    chalk = require('chalk'),
    {
      indentationReplacer,
      writeJsonIndentation
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
    jsonSchemaDereferencedPath
  } = specPaths;

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
            'application/json': content['application/json']
          }
        };
        return accum;
      },
      {}
    ),
    requestBodiesKeys = _.uniq(
      Object.keys(_.index(paths))
        .filter(entry => {
          // e.g. requestBody.content['text/xml']
          return entry.includes('requestBody.content[');
        })
        .map(entry => {
          return entry.split('.content')[0];
        })
    ),
    pathContentKeys = _.uniq(
      Object.keys(_.index(paths))
        .filter(entry => {
          // e.g. responses['200'].content['text/xml']
          return entry.includes('].content[') && entry.includes('responses');
        })
        .map(entry => {
          return entry.split('.content')[0];
        })
    );
  _.each(requestBodiesKeys, entry => {
    let jsonroute = `${entry}.content`,
      jsoncontent = _.get(paths, jsonroute),
      goodcontent = jsoncontent['application/json'];
    _.set(paths, jsonroute, {
      'application/json': goodcontent
    });
  });
  _.each(pathContentKeys, entry => {
    let jsonroute = `${entry}.content`,
      jsoncontent = _.get(paths, jsonroute),
      goodcontent = jsoncontent['application/json'];
    _.set(paths, jsonroute, {
      'application/json': goodcontent
    });
  });

  let prunedOpenApiSchema = {
    ...openApiSchema,
    paths,
    components: {
      ...components,
      requestBodies: prunedRequestBodies
    }
  };

  async function generateTypeDefs(dereferencedSchema) {
    let typeDefs = {};
    await writeJsonIndentation(prunedOpenApiSchemaPath, prunedOpenApiSchema);
    for (let [modelName, modelDef] of Object.entries(
      dereferencedSchema.components.schemas
    )) {
      typeDefs[modelName] = await jsonSchemaToTypeDef.default(
        modelDef,
        modelName
      );
      typeDefs[modelName] = ['/**']
        .concat(
          typeDefs[modelName].map(props => {
            return props.split('\n').map(line => {
              return '* ' + line.trim();
            });
          })
        )
        .concat(['*/']);
    }

    return writeJsonIndentation(
      jsonSchemaPath.replace('.json', '-typedefs.json'),
      typeDefs
    );
  }
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
      debug({compile, compileFromFile, otherProps});
      await writeJsonIndentation(
        jsonSchemaDereferencedPath,
        dereferencedSchema
      );
      await generateTypeDefs(dereferencedSchema);
      /*
      await compile(dereferencedSchema.components, 'components').then(ts =>
        fs.writeFileAsync(
          `${process.env.PROJECT_ROOT}/server/types/components.jsonschema.to.ts`,
          ts
        )
      );
      await compile(convertedSchema.components.schemas, 'schemas').then(ts =>
        fs.writeFileAsync(
          `${process.env.PROJECT_ROOT}/server/types/schemas.jsonschema.to.ts`,
          ts
        )
      );
      await compile(
        convertedSchema.components.schemas.Boton,
        'Boton'
      ).then(ts =>
        fs.writeFileAsync(
          `${process.env.PROJECT_ROOT}/server/types/Boton.jsonschema.to.ts`,
          ts
        )
      );
      */
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
