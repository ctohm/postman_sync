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

let originalSpec = require(postmanSpecPath),
  info = _.cloneDeep(originalSpec.info);

let {postmanCollection, mapPostmanIds} = normalizeCollectionIds(
    originalSpec,
    true,
    false,
    {}
  ),
  swaggerContentRaw = require(swaggerSpecPath);

// convert Swagger 2.0 to Postman 2.0

/*originalSpec = originalSpec.replace(
      /\\"idBoton\\": \\"\\"/g,
      '"idBoton": "18FE34996BCD"'
    );*/
var convertedSpecRaw = Converter.convert(swaggerContentRaw);
/*pmCollection = {
    collection: {
      info: originalInfo
    }
  };*/

// Reindenta la colección postman
let conversionResult = Object.assign(
  {info},
  _.omit(convertedSpecRaw.collection, ['info'])
);
debug({mapPostmanIds});
let {postmanCollection: swaggerCollection} = normalizeCollectionIds(
  conversionResult,
  true,
  false,
  mapPostmanIds
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
    .then(async () => {
      let postmanReduced = _.reduce(
        postmanCollection.toJSON(),
        (accum, content, key) => {
          key = key || content.id;
          accum[key] = content;
          return accum;
        },
        {}
      );

      let swaggerReduced = _.reduce(
        swaggerCollection.toJSON(),
        (accum, content, key) => {
          key = key || content.id;
          accum[key] = content;
          return accum;
        },
        {}
      );

      await writeJsonIndentation(swaggerReducedPath, swaggerReduced);
      await writeJsonIndentation(postmanReducedPath, postmanReduced);
    })
    // .delay(500)
    /*.then(() => {
      debug(
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
      );
      //debug(normalizedCollection.items.assimilate);
      //debug('swaggerCollection.items.assimilate(postmanCollection.items);');
      //swaggerCollection.items.assimilate(postmanCollection.items);

      // Reindenta la colección postman

      return writeJsonIndentation(
        path.resolve(`${__dirname}/specs/postman-assimilated-spec.json`),
        postmanCollection.toJSON()
      );
    })*/
    .catch(err => {
      console.error(err);
    })
);
