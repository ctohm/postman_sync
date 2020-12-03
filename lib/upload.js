#!/usr/bin/env node
const getPostmanSpecPaths = require('./utils/get_spec_paths.js')
    .getPostmanSpecPaths,
  chalk = require('chalk');
/**
 * Takes a base spec, notmalizes it
 * - optionally: adds tests and prerequest scripts (if passed)
 * - optionally: dump the exact payload that will be uploaded (if dumpPath is passed)
 * Then uploads spec to postman
 *
 * @param  {Object}   arg1                 The argument 1
 * @param  {<type>}   arg1.sourceSpecfile  The source specfile
 * @param  {boolean}  [arg1.dryRun=false]  The dry run
 * @param  {<type>}   arg1.snapshotFile    The snapshot file
 * @return {<type>}   { description_of_the_return_value }
 */
function uploadToPostman(
  Config,
  {sourceSpecfile, dryRun = false, snapshotFile} = {}
) {
  // normalize the configuration object
  Config = require(`${__dirname}/config.js`)(Config, __filename);

  const Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),
    path = require('path'),
    this_script = path.basename(__filename, path.extname(__filename)),
    debug = require('debug')(`pm_sync:${this_script}`),
    specPaths = getPostmanSpecPaths(Config),
    _ = require('lodash');

  debug('Requiring specPaths');

  debug('Requiring getCollectionVersionAndInfo');
  const {
    getCollectionVersionAndInfo,
    getOptionsCollection,
    getOptionsEnvironment,
  } = require(`${Config.UTILS_FOLDER}/postman_request_options.js`)(Config);

  debug('Requiring indentationReplacer');
  const {
      indentationReplacer,
      writeJsonIndentation,
    } = require(`${Config.UTILS_FOLDER}/write-json-indentation.js`)(Config),
    //originalSpec = require(specPath),
    fetch = require('node-fetch');

  let /* Default Paths, under ${SPECS_FOLDER} or ${PMSYNC_FOLDER}/specs  */
    {
      postmanForUploadPath, //  default snapShotFile
      postmanConvertedPath, // default sourceSpecFile
    } = specPaths;

  snapshotFile = snapshotFile || postmanForUploadPath || null;
  sourceSpecfile = sourceSpecfile || postmanConvertedPath || null;

  return Promise.resolve()
    .then(async function () {
      debug(`Will upload spec from file ${chalk.bold.yellow(sourceSpecfile)}`);
      let pmCollection = require(sourceSpecfile /*postmanIndentedSpecPath /* postmanAssimilatedPath */);

      pmCollection = pmCollection.collection
        ? pmCollection
        : {collection: pmCollection};

      let updatedInfo = getCollectionVersionAndInfo(pmCollection.collection),
        info = Object.assign(pmCollection.collection.info, updatedInfo),
        {POSTMAN_INJECT_SCRIPTS, POSTMAN_ENV, injectCollectionScripts} = Config;
      debug({
        POSTMAN_ENV,
        dryRun,
        injectCollectionScripts,
        POSTMAN_INJECT_SCRIPTS,
      });
      if (
        Config.POSTMAN_INJECT_SCRIPTS &&
        (dryRun || Config.POSTMAN_ENV === 'TEST') &&
        typeof Config.injectCollectionScripts === 'function'
      ) {
        pmCollection.collection = await Config.injectCollectionScripts(
          Config,
          pmCollection.collection
        );
      }

      pmCollection.collection = Object.assign(
        {info},
        _.omit(pmCollection.collection, ['info'])
      );
      await writeJsonIndentation(snapshotFile, pmCollection);

      debug(
        `uploading collection ${chalk.yellow(
          pmCollection.collection.info.name
        )} to (${chalk.yellow(Config.POSTMAN_COLLECTION_UID)})`
      );

      var putOptions = {
          ...getOptionsCollection(),
          method: 'PUT',
        },
        {url, method, headers} = putOptions,
        body = JSON.stringify(pmCollection);

      debug(putOptions);
      if (dryRun) {
        return {res: 'dryRun', snapshotFile};
      }

      return fetch(url, {method, headers, body})
        .then((res) => {
          debug({ok: res.ok, status: res.status, statusText: res.statusText});
          return res;
        })
        .then((res) => {
          return res.json();
        });
    })
    .then(async (jsonRes) => {
      debug({jsonRes});
    })
    .catch((err) => {
      debug({err});
    });
}

if (require.main === module) {
  uploadToPostman(require(`${__dirname}/config.js`)(process.env), {
    dryRun: false,
  });
  //  reduceCollections();
}
module.exports = uploadToPostman;
