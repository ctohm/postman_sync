#!/usr/bin/env node
async function inspectCollections(Config) {
  // normalize the configuration object
  Config = require(`${__dirname}/config.js`)(Config);
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
    entityUtils = require(`${Config.UTILS_FOLDER}/entity-utils.js`)(Config),
    mkdirp = require('mkdirp'),
    normalizeCollectionIds = require(`${Config.UTILS_FOLDER}/normalize_collection_ids.js`)(
      Config
    ),
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

  function countRequests(itemGroup, accum = [], trim = false) {
    let items = itemGroup.items || itemGroup.item || {},
      responses = itemGroup.response || items.response,
      subitem = items.item || items.items;
    if (responses) {
      //debug(response);
      let codes = (trim
        ? responses.filter(response => {
            return ![401, 403, 404].includes(response.code);
          })
        : responses
      ).map(response => response.code);
      accum = accum.concat(codes);
    } else if (items instanceof Array) {
      accum = accum.concat(
        items.reduce((accum2, subGroup) => {
          accum2 = accum2.concat(countRequests(subGroup, accum, trim));
          return accum2;
        }, [])
      );
    }
    return accum;
  }
  function countEvents(
    itemGroup,
    accum = [],
    parent = '',
    suffix = [],
    saveFolder = 'postman_testscripts'
  ) {
    let {item: items, event: events, name = 'root'} = itemGroup || {},
      shouldRecurse = items instanceof Array && items.length,
      chalkFN = chalk.cyan;

    if (parent === 'root') {
      chalkFN = chalk.bold.yellow;
      suffix = [name.charAt(0)];
    }
    name = name.replace(/^[\d_.\s]*/, '');
    name = name.charAt(0).toUpperCase() + name.slice(1);
    let suffixTxt = suffix.join('_');

    name = `${suffixTxt}_${name}`;
    if (events && events.length) {
      events = events
        .map(event => {
          let {listen, script: {id, type, exec} = {}} = event;
          return {name: `${name}_${listen}`, id, execLines: exec.length, exec};
        })
        .filter(event => event.execLines);
      mkdirp.sync(`${process.env.PMSYNC_FOLDER}/${saveFolder}`);

      accum = accum.concat(
        events.map(event => {
          let {exec, ...cleanEvent} = event,
            fileName = `${
              process.env.PMSYNC_FOLDER
            }/${saveFolder}/${_.snakeCase(
              cleanEvent.name.split('/').pop()
            )}.js`,
            dirname = `${process.env.PMSYNC_FOLDER}/postman_testscripts/`;
          if (!['8', '9'].includes(suffix[0]) && suffix.length === 2) {
            debug({saveFolder, fileName: fileName.replace(dirname, ''), name});
          }
          fs.writeFileSync(
            fileName,
            [
              `// ${cleanEvent.name}`,
              `// ${cleanEvent.id}`,
              ``,
              ``,
              ``,
              `const _ = require('lodash'),`,
              `  tv4 = require('tv4'),`,
              `pm = {};`,
              ``,
              `/* eslint-disable no-unused-expressions,no-extend-native */`
            ]
              .concat(exec)
              .join('\n')
          );
          return cleanEvent;
        })
      );
    }

    if (shouldRecurse) {
      //debug({saveFolder});

      accum = accum.concat(
        items.reduce((accum2, subGroup, index) => {
          let newSuffix = suffix.concat(String(1 + index).padStart(2, '0'));
          if (name === 'root') {
            newSuffix = [String(index + 1)];
          }

          let newSaveFolder = `${saveFolder}/${newSuffix.join(
            '_'
          )}_${_.snakeCase(subGroup.name.replace(/^[\d_.\s]*/, ''))}`;
          mkdirp.sync(`${process.env.PMSYNC_FOLDER}/${newSaveFolder}`);

          accum2 = accum2.concat(
            countEvents(subGroup, accum, name, newSuffix, newSaveFolder)
          );
          return accum2;
        }, [])
      );
    }
    return accum;
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
    postmanCollection.items = postmanCollection.items.map(child => {
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
          otherKeys: Object.keys(otherKeys)
          // events
        });
        return writeJsonIndentation(postmanConvertedPath, {
          info: infoKey,
          item,
          ...otherKeys
        });
      })
      .catch(errpromise => {
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
