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
      Collection,
      Version,
      mapChildren
    } = require(`${Config.UTILS_FOLDER}/postman_collection_common_fn.js`)(
      Config
    ),
    {
      // countEvents,
      countRequests,
      trimResponses
    } = require(`${Config.UTILS_FOLDER}/postman_entities_traverse.js`);

  function mapEvents(
    name,
    events = [],
    parent = '',
    breakCrumb = [],
    saveFolder = `${Config.OUTPUT_FOLDER}/postman_testscripts`
  ) {
    let suffixTxt = breakCrumb.join('_');

    name = `${suffixTxt}_${name}`;
    debug({beforeFiltering: events.length});
    events = events
      .map(event => {
        let {listen, script: {id, type, exec} = {}} = event;
        return {
          listen,
          name: `${name}.${listen}`,
          id,
          execLines: exec.length,
          exec
        };
      })
      .filter(event => event.execLines);
    mkdirp.sync(`${saveFolder}`);
    debug({afterFiltering: events.length});
    return events.map(event => {
      let {exec, listen, ...cleanEvent} = event,
        cleanName = _.snakeCase(cleanEvent.name.split('/').pop());

      let fileName = `${saveFolder}/${cleanName}.js`.replace(
          `_${listen}.js`,
          `.${listen}.js`
        ),
        dirname = `${saveFolder}`;
      if (!['8', '9'].includes(breakCrumb[0]) && breakCrumb.length === 2) {
        debug({
          cleanName,
          listen,
          saveFolder: saveFolder.replace(dirname, ''),
          // fileName: fileName.replace(dirname, ''),
          name
        });
      }
      debug('WRITING', fileName.replace(Config.OUTPUT_FOLDER, ''));
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
          separatorComment
        ]
          .concat(exec)
          .join('\n')
      );
      return cleanEvent;
    });
  }

  function processEvents(
    itemGroup,
    accum = [],
    parent = '',
    breakCrumb = [],
    saveFolder = `${Config.OUTPUT_FOLDER}/postman_testscripts`
  ) {
    let {item: items, event: events, name = 'root'} = itemGroup || {},
      shouldRecurse = items instanceof Array && items.length;

    if (events && events.length) {
      debug(
        `${breakCrumb.join(' > ')} parent, ${items &&
          items.length} items, ${events && events.length} events`
      );
      let eventMap = mapEvents(name, events, parent, breakCrumb, saveFolder);
      accum = accum.concat(eventMap);
    }
    if (shouldRecurse) {
      accum = accum.concat(
        items.reduce((accum2, subGroup, index) => {
          let newSuffix = breakCrumb.concat(
            (breakCrumb.length ? String(index) : String(index + 1)).padStart(
              breakCrumb.length,
              '0'
            )
          );

          let cleanSubgroupName = subGroup.name.replace(/^[\d_.\s]*/, ''),
            newSubFolder = `${newSuffix.join('_')}_${_.snakeCase(
              cleanSubgroupName
            )}`,
            newSaveFolder = `${saveFolder}/${newSubFolder}`;
          mkdirp.sync(`${newSaveFolder}`);
          debug({newSuffix, cleanSubgroupName, newSubFolder});
          accum2 = accum2.concat(
            processEvents(subGroup, accum, name, newSuffix, newSaveFolder)
          );
          return accum2;
        }, [])
      );
    }
    return accum;
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
          requestsBefore = countRequests(pmCopy);

        let events = _.uniq(processEvents(pmCopy)),
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
        console.error(errpromise);
        debug(errpromise);
      });
  } catch (err) {
    console.error(err);
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
