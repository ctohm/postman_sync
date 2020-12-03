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
      writeJsonIndentation,
    } = require(`${Config.UTILS_FOLDER}/write-json-indentation.js`)(Config),
    mkdirp = require('mkdirp'),
    normalizeCollectionIds = require(`${Config.UTILS_FOLDER}/normalize_collection_ids.js`)(
      Config
    ),
    separatorComment = `/* eslint-disable no-unused-expressions,no-extend-native */`,
    /* Swagger Paths */
    {
      swaggerAncestorPath,
      swaggerIndentedSpec,
      swaggerRawConvertedPath,
      swaggerSpecPath,
      swaggerConvertedPath,
      swaggerReducedPath,
      swaggerAssimilatedPath,
    } = specPaths,
    /* Postman Paths */
    {
      postmanAssimilatedPath,
      postmanAncestorPath,
      postmanIndentedSpec,
      postmanSpecPath,
      postmanConvertedPath,
      postmanReducedPath,
    } = specPaths,
    {
      getTypes,
      getMethodPath,
      debugWithParent,
      getNameAndId,
      listEach,
      Collection,
      Version,
      mapChildren,
    } = require(`${Config.UTILS_FOLDER}/postman_collection_common_fn.js`)(
      Config
    ),
    {
      countEvents,
      processEvents,
    } = require(`${Config.UTILS_FOLDER}/pm_events.js`)(Config),
    {
      // countEvents,
      countRequests,
      trimResponses,
    } = require(`${Config.UTILS_FOLDER}/postman_entities_traverse.js`);

  let postmanSpec = require(postmanSpecPath);
  if (postmanSpec.collection) {
    postmanSpec = postmanSpec.collection;
  }
  let info = _.cloneDeep(postmanSpec.info);

  let postmanCollection = new Collection(postmanSpec);
  postmanCollection.version = postmanCollection.version || new Version();
  debug(postmanCollection.version);
  //debug({postmanCollectionVersion: postmanCollection.version.toJSON()});

  let postmanAncestor = {},
    pmCopy = Object.assign({}, postmanCollection.toJSON());

  try {
    postmanCollection.items = postmanCollection.items.map((child) => {
      let itemgroup = mapChildren({child, parent: postmanCollection});
      //debug({childType: getTypes(child)});
      return itemgroup.toJSON ? itemgroup.toJSON() : itemgroup;
    });
    return Promise.resolve()
      .delay(2000)
      .then(async () => {
        let {
            items: item,
            info: infoKey,
            ...otherKeys
          } = postmanCollection.toJSON(),
          requestsBefore = countRequests(pmCopy),
          events = _.uniq(countEvents(pmCopy)),
          trimmed = trimResponses(item),
          requestsAfter = countRequests({item: trimmed});

        debug({
          requestsBefore: requestsBefore.length,
          requestsAfter: requestsAfter.length,
          otherKeys: Object.keys(otherKeys),
          // events
        });
        return writeJsonIndentation(postmanConvertedPath, {
          info: infoKey,
          item,
          ...otherKeys,
        });
      })
      .catch((errpromise) => {
        debug(errpromise);
      });
  } catch (err) {
    debug(err);
  }
  debug(`ORIGINAL Postman spec came from ${chalk.bold.green(postmanSpecPath)}`);
  return await writeJsonIndentation(postmanAncestorPath, postmanAncestor);
}

if (require.main === module) {
  inspectCollections(require(`${__dirname}/config.js`)(process.env));
  //  reduceCollections();
}
module.exports = inspectCollections;
