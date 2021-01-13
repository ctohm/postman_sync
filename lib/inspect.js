#!/usr/bin/env node

const {red} = require('chalk');
inspect = require('util').inspect;

function prettyInspect(
  obj,
  {breakLength = 80, compact = 3, depth = 2, colors = true} = {}
) {
  console.log(inspect(obj, {breakLength, compact, depth, colors}));
}
const {
  Collection,

  PropertyList,
  Item,
  ItemGroup,
} = require('postman-collection');

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
    swaggerpecPaths = require(`./utils/get_spec_paths.js`).getSwaggerpecPaths(
      Config
    ),
    postmanSpecPaths = require(`./utils/get_spec_paths.js`).getPostmanSpecPaths(
      Config
    ),
    this_script = path.basename(__filename, path.extname(__filename)),
    //debug = require('debug')(`pm_sync:${this_script}`),
    debug = require('debug')(`pm_sync:${this_script}`),
    Converter = require('swagger2-postman2-parser'),
    {
      indentationReplacer,
      writeJsonIndentation,
    } = require(`./utils/write-json-indentation.js`)(Config),
    mkdirp = require('mkdirp'),
    normalizeCollectionIds = require(`./utils/normalize_collection_ids.js`)(
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
    } = swaggerpecPaths,
    /* Postman Paths */
    {
      postmanAssimilatedPath,
      postmanAncestorPath,
      postmanIndentedSpec,
      postmanSpecPath,
      postmanConvertedPath,
      postmanReducedPath,
    } = postmanSpecPaths,
    {
      getTypes,
      getMethodPath,
      debugWithParent,
      getNameAndId,
      listEach,
      Version,
      mapChildren,
    } = require(`./utils/postman_collection_common_fn.js`)(Config),
    {countEvents, processEvents} = require(`./utils/pm_events.js`)(Config),
    {
      // countEvents,
      countRequests,
      trimResponses,
    } = require(`./utils/postman_entities_traverse.js`);

  let postmanSpec = require(postmanSpecPath);
  if (postmanSpec.collection) {
    postmanSpec = postmanSpec.collection;
  }
  let info = _.cloneDeep(postmanSpec.info);

  /**
   * @type {import('postman-collection').Collection}
   */
  let postmanCollection = new Collection(postmanSpec);
  postmanCollection.version = postmanCollection.version || new Version();
  //debug({postmanCollectionVersion: postmanCollection.version.toJSON()});
  /**
   * @type {ItemGroup}
   */
  let items = postmanCollection.items,
    contexto = {},
    accumulator = [],
    reduccion = items.reduce(
      (previous, item, index, accum) => {
        previous.push(item);
        return previous;
        //return previous;
        //  debug({previousLength:previous.length,push:(!previous||!previous.push)?previous:_.functions(previous)})
        /* if(Item.isItem(item) ) {
    let 
      events=item.events,
      children=item.items,
      isItemGroup=ItemGroup.isItemGroup(item),
      
      isItem=Item.isItem(item)    ,
    preRequest=events.find(event=> event.listen === 'prerequest'),
    testRequest=events.find(event=> event.listen === 'test');
   
    console.log({description:item.meta(),name:item.name,events,children,isItem,isItemGroup,preRequest,testRequest});
  }*/
        return accum;
      },
      accumulator,
      contexto
    );
  //prettyInspect(reduccion);
  //return;

  let postmanAncestor = {},
    pmCopy = Object.assign({}, postmanCollection.toJSON());

  try {
    postmanCollection.items = postmanCollection.items.map(
      (child, childIndex) => {
        return mapChildren({
          child,
          childIndex,
          parent: postmanCollection,
          prefix: [childIndex],
        });
      }
    );
    return Promise.resolve()
      .delay(500)
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
          //events,
        });
        console.log({
          postmanConvertedPath,
          folderNames: item.map((i) => i.name),
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
