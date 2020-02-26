#!/usr/bin/env node

const Promise = require('bluebird'),
  fs = Promise.promisifyAll(require('fs')),
  path = require('path'),
  _ = require('lodash'),
  chalk = require('chalk'),
  Config = require(`${process.env.LIB_FOLDER}/config.js`),
  this_script = path.basename(__filename, path.extname(__filename)),
  debug = require('debug')(`${Config.DEBUG_PREFIX}:${this_script}`),
  Converter = require('swagger2-postman2-parser'),
  {
    indentationReplacer,
    writeJsonIndentation
  } = require(`${__dirname}/write-json-indentation.js`),
  entityUtils = require(`${__dirname}/entity-utils.js`),
  normalizeCollectionIds = require(`${__dirname}/normalize_collection_ids.js`),
  pretty = function(obj) {
    // function to neatly log the collection object to console
    return require('util').inspect(obj, {colors: true});
  },
  Collection = require('postman-collection').Collection;

let specPaths = require(`${__dirname}/get_spec_paths.js`),
  /* Swagger Paths */
  {
    swaggerAncestorPath,
    swaggerIndentedSpec,
    swaggerRawConvertedPath,
    swaggerSpecPath,
    swaggerConvertedPath,
    swaggerReducedPath,
    swaggerAssimilatedPath
  } = specPaths,
  /* Postman Paths */
  {
    postmanAssimilatedPath,
    postmanAncestorPath,
    postmanIndentedSpecPath,
    postmanSpecPath,
    postmanConvertedPath,
    postmanReducedPath
  } = specPaths;

let postmanSpec = require(postmanSpecPath),
  swaggerSpec = require(swaggerSpecPath),
  info = _.cloneDeep(postmanSpec.info);

let {
  parsedCollection: postmanCollection,
  idMapping: mapPostmanIds,
  ancestor: postmanAncestors
} = normalizeCollectionIds(postmanSpec, false, false, false /* {}*/);

// convert Swagger 2.0 to Postman 2.0

/*postmanSpec = postmanSpec.replace(
      /\\"idBoton\\": \\"\\"/g,
      '"idBoton": "18FE34996BCD"'
    );*/
let convertedSpecRaw = Converter.convert(swaggerSpec);

swaggerSpec = Object.assign(
  {info},
  _.omit(convertedSpecRaw.collection, ['info'])
);

let {
  parsedCollection: swaggerCollection,
  idMapping: mapSwaggerIds,
  ancestor: swaggerAncestors
} = normalizeCollectionIds(
  swaggerSpec,
  false,
  false,
  false /*, mapPostmanIds*/
);
//let convertedSpec = new Collection(conversionResult);

return (
  writeJsonIndentation(swaggerConvertedPath, swaggerCollection.toJSON())
    .then(() => {
      return writeJsonIndentation(
        postmanConvertedPath,
        postmanCollection.toJSON()
      );
    })
    .then(() => {
      return writeJsonIndentation(postmanAncestorPath, postmanAncestors);
    })
    .then(() => {
      return writeJsonIndentation(swaggerAncestorPath, swaggerAncestors);
    })
    // .delay(500)
    .then(() => {
      /*debug(
        'BEFOPRE: postmanCollection has ',
        postmanCollection.items.members.length,
        'elements'
      );
      debug('postmanCollection.items.assimilate(swaggerCollection.items);');
      postmanCollection.items.assimilate(swaggerCollection.items);
      debug(
        'AFTER: postmanCollection has ',
        postmanCollection.items.members.length,
        'elements'
      );*/

      debug(
        'BEFORE: swaggerCollection has ',
        swaggerCollection.items.members.length,
        'elements'
      );
      debug('swaggerCollection.items.assimilate(postmanCollection.items);');
      swaggerCollection.items.assimilate(postmanCollection.items);
      debug(
        'AFTER: swaggerCollection has ',
        swaggerCollection.items.members.length,
        'elements'
      );

      //debug(normalizedCollection.items.assimilate);
      //debug('swaggerCollection.items.assimilate(postmanCollection.items);');
      //swaggerCollection.items.assimilate(postmanCollection.items);

      // Reindenta la colección postman

      /*return writeJsonIndentation(
        postmanAssimilatedPath,
        postmanCollection.toJSON()
      );*/

      /*return writeJsonIndentation(
        swaggerAssimilatedPath,
        swaggerCollection.toJSON()
      );*/
      return;
    })
    .catch(err => {
      console.error(err);
    })
);
