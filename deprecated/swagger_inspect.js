#!/usr/bin/env node
async function inspectCollections(
  Config,
  {sourceSpecfile, dryRun = false, snapshotFile} = {}
) {
  // normalize the configuration object
  Config = require(`${__dirname}/config.js`)(Config, __filename);
  const Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),
    path = require('path'),
    _ = require('lodash'),
    chalk = require('chalk'),
    specPaths = require(`${Config.UTILS_FOLDER}/get_spec_paths.js`)(Config),
    this_script = path.basename(__filename, path.extname(__filename)),
    //debug = require('debug')(`pm_sync:${this_script}`),
    debug = require('debug')(`pm_sync:${this_script}`),
    Converter = require('swagger2-postman2-parser'),
    {
      indentationReplacer,
      writeJsonIndentation
    } = require(`${Config.UTILS_FOLDER}/write-json-indentation.js`)(Config),
    mkdirp = require('mkdirp'),
    normalizeCollectionIds = require(`${Config.UTILS_FOLDER}/normalize_collection_ids.js`)(
      Config
    ),
    Version = require('postman-collection').Version,
    Collection = require('postman-collection').Collection,
    separatorComment = `/* eslint-disable no-unused-expressions,no-extend-native */`,
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
      postmanIndentedSpec,
      postmanSpecPath,
      postmanConvertedPath,
      postmanReducedPath
    } = specPaths,
    {
      getTypes,
      getMethodPath,
      debugWithParent,
      getNameAndId,
      listEach,
      mapChildren
    } = require(`${Config.UTILS_FOLDER}/postman_collection_common_fn.js`)(
      Config
    );

  function trimResponses(itemGroup, level = 0) {
    level++;
    itemGroup.item = itemGroup.item || itemGroup.items;
    let {item: items, request, response: responses, ...otherKeys} = itemGroup;
    // debug({items, responses});
    if (itemGroup._ && itemGroup._.postman_isSubFolder) {
      //debug('postman_isSubFolder', itemGroup);
      itemGroup.item = itemGroup.item.map(item => {
        return trimResponses(item, level);
      });
    } else if (itemGroup.code) {
      //debug('HAS CODE', itemGroup);
    } else if (itemGroup instanceof Array) {
      //debug('itemGroup is Array', itemGroup);

      itemGroup = itemGroup.map(item => {
        return trimResponses(item, level);
      });
    } else if (itemGroup.item instanceof Array) {
      //debug('itemGroup.item is Array', itemGroup);
      itemGroup.item = itemGroup.item.map(item => {
        let trimmed = trimResponses(item, level);
        //debug(trimmed);
        return trimmed;
      });

      //debug(itemGroup);
    } else if (items && (items.response || items.request)) {
      responses = (items.response || []).filter(response => {
        let code = response.code;
        //debug(code);
        return ![401, 403, 404].includes(code);
      });

      itemGroup.item.response = responses;
    } else if (responses || request) {
      responses = (responses || {}).filter(response => {
        let code = response.code;
        //debug(code);
        return ![401, 403, 404].includes(code);
      });

      itemGroup.response = responses;
    } else {
      /* else if (items.item instanceof Array) {
    itemGroup.item = itemGroup.item.concat(
      items.item.map(item => {
        let trimmed = trimResponses(item);
        //debug(trimmed);
        return trimmed;
      })
    );*/
      debug(itemGroup);
    }
    return itemGroup;
  }

  async function inspectSwagger() {
    let postmanSpec = require(postmanSpecPath);
    if (postmanSpec.collection) {
      postmanSpec = postmanSpec.collection;
    }
    let swaggerSpec = require(swaggerSpecPath),
      info = _.cloneDeep(postmanSpec.info);

    let convertedSpecRaw = Converter.convert(swaggerSpec);

    swaggerSpec = Object.assign(
      {info},
      _.omit(convertedSpecRaw.collection, ['info', 'variables'])
    );
    swaggerSpec.variable = convertedSpecRaw.collection.variables;

    await writeJsonIndentation(swaggerRawConvertedPath, convertedSpecRaw);

    let swaggerCollection = new Collection(swaggerSpec),
      postmanCollection = new Collection(postmanSpec);
    postmanCollection.version = postmanCollection.version || new Version();
    debug(postmanCollection.version);
    //debug({postmanCollectionVersion: postmanCollection.version.toJSON()});

    let postmanAncestor = {},
      pmCopy = Object.assign({}, postmanCollection.toJSON());

    await writeJsonIndentation(postmanAncestorPath, postmanAncestor);
    debug(
      `ORIGINAL Postman spec came from ${chalk.bold.green(postmanSpecPath)}`
    );

    await writeJsonIndentation(
      swaggerConvertedPath,
      swaggerCollection.toJSON()
    );
    return;
  }
}

if (require.main === module) {
  inspectCollections(require(`${__dirname}/config.js`)(process.env));
  //  reduceCollections();
}
module.exports = inspectCollections;
