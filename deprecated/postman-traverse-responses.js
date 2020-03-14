#!/usr/bin/env node
async function inspectCollections(Config) {
  const Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),
    path = require('path'),
    _ = require('lodash'),
    chalk = require('chalk'),
    specPaths = require(`${Config.UTILS_FOLDER}/get_spec_paths.js`),
    this_script = path.basename(__filename, path.extname(__filename)),
    debug = require('debug')(`postman_synchronizer:${this_script}`),
    Converter = require('swagger2-postman2-parser'),
    {
      indentationReplacer,
      writeJsonIndentation
    } = require(`${Config.UTILS_FOLDER}/write-json-indentation.js`)(Config),
    entityUtils = require(`${Config.UTILS_FOLDER}/entity-utils.js`),
    normalizeCollectionIds = require(`${Config.UTILS_FOLDER}/normalize_collection_ids.js`),
    Request = require('postman-collection').Request,
    Response = require('postman-collection').Response,
    Header = require('postman-collection').Header,
    HeaderList = require('postman-collection').HeaderList,
    PropertyList = require('postman-collection').PropertyList,
    Variable = require('postman-collection').Variable,
    VariableList = require('postman-collection').VariableList,
    Version = require('postman-collection').Version,
    Collection = require('postman-collection').Collection,
    Item = require('postman-collection').Item,
    ItemGroup = require('postman-collection').ItemGroup;

  const /* Swagger Paths */
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

  let postmanAncestor = {};

  try {
    postmanCollection.items = postmanCollection.items.map(child => {
      let itemgroup = mapChildren({child, parent: postmanCollection});
      debug({childType: getTypes(child)});
      return itemgroup.toJSON ? itemgroup.toJSON() : itemgroup;
    });
    await writeJsonIndentation(
      postmanConvertedPath,
      postmanCollection.toJSON()
    );
  } catch (err) {
    debug(err);
  }
  await writeJsonIndentation(postmanAncestorPath, postmanAncestor);
  debug(`ORIGINAL Postman spec came from ${chalk.bold.green(postmanSpecPath)}`);
  /*let postmanReduction = _.reduce(
    listEach(postmanCollection.items, [], false, postmanAncestor),
    (accum, item) => {
      if (item && item.id) {
        accum[item.id] = item;
      }
      return accum;
    },
    {}
  );
  await writeJsonIndentation(postmanReducedPath, postmanReduction);*/
  //debug(chalk.red('<================== swaggerReduction ===============>'));
  /* let swaggerReduction = _.reduce(
    listEach(swaggerCollection.items, []),
    (accum, item) => {
      if (item && item.id) {
        accum[item.id] = item;
      }
      return accum;
    },
    {}
  );
  await writeJsonIndentation(swaggerReducedPath, swaggerReduction);
  */
  await writeJsonIndentation(swaggerConvertedPath, swaggerCollection.toJSON());
  return;
}

/*async function reduceCollections() {
  let postmanSpec = require(postmanSpecPath),
    swaggerSpec = require(swaggerSpecPath),
    {parsedCollection: postmanCollection, idMapping} = normalizeCollectionIds(
      postmanSpec,
      true,
      false,
      {}
    ),
    {parsedCollection: swaggerCollection} = normalizeCollectionIds(
      swaggerSpec,
      true,
      false,
      idMapping
    );
  await writeJsonIndentation(swaggerReducedPath, swaggerCollection);

  await writeJsonIndentation(postmanReducedPath, postmanSpec);

  await writeJsonIndentation(postmanMergedSpecPath, idMapping);
}*/

if (require.main === module) {
  inspectCollections();
  //  reduceCollections();
}
