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
    generateTypes=require('./dtsgen'),
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
    outputTypesPath
  } = specPaths;

console.log('Reading openApiSchema from '+openApiJsonSpecPath);
  const openApiSchema = require(openApiJsonSpecPath),
    prunedOpenApiSchemaPath = openApiJsonSpecPath.replace(
      'openapi-spec',
      'openapi-schema'
    ),
    {components, paths} = openApiSchema,
    {requestBodies} = components;
    outputTypesPath=outputTypesPath||prunedOpenApiSchemaPath.replace('specs/openapi/openapi-schema.json','types/dtsgen.from.openapi.ts');
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
  let indexPaths=Object.keys(_.index(paths));
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
  console.log({indexPaths:indexPaths.length,requestBodiesKeys:requestBodiesKeys.length});
  let  pathContentKeys = _.uniq(
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

  async function generateTypeDefs(dereferencedSchema) {
    let typeDefs = {}, allTypesArray=[];
    await writeJsonIndentation(prunedOpenApiSchemaPath, prunedOpenApiSchema);
    for (let [modelName, modelDef] of Object.entries(
      dereferencedSchema.components.schemas
    )) {
      typeDefs[modelName] = await jsonSchemaToTypeDef.default(
        {type:'object',...modelDef},
        modelName
      );
       typeDefs[modelName] =typeDefs[modelName].reduce((accum,props) => {
        accum=accum.concat(props.split('\n').reduce((accum2,line) => {
              accum2.push( ' * ' + line.trim());
             return accum2;
            },['/**']));
            return accum;
          },[]).concat([' */']);

         allTypesArray=allTypesArray.concat([`
        `],typeDefs[modelName]  ,[`
        `])
    }
let typeDefPaths=jsonSchemaPath.replace('.json', '-typedefs.json').replace('specs/json-schema','types');
     fs.writeFileSync(typeDefPaths.replace('.json','.js'),Object.values(typeDefs).reduce((accum,type)=>{
       accum=accum.concat(type);
       accum.push("\n");
       return accum;
     },[]).join("\n"));
    return writeJsonIndentation(
      typeDefPaths,
      typeDefs
    );
  }
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
      const dtsgen=require('dtsgenerator');

      // debug({compile, compileFromFile, otherProps});
      await writeJsonIndentation(
        jsonSchemaDereferencedPath,
        dereferencedSchema
      );
      await generateTypeDefs(dereferencedSchema);
      console.log(dtsgen);
      return dereferencedSchema;
    } catch (err) {
      console.error(err);
    }
  }
  return convertir(prunedOpenApiSchema).then(()=>{
    return generateTypes({openApiSrc:openApiJsonSpecPath,outputFile:outputTypesPath})
  })
}
//writeJsonIndentation(jsonSchemaPath, convertedSchema).then(async () => {});

if (require.main === module) {
  openApiToJsonSchema(require(`${__dirname}/config.js`)(process.env));
  //  reduceCollections();
}
module.exports = openApiToJsonSchema;
