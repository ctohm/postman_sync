#!/usr/bin/env node

const Promise = require('bluebird'),
  fs = Promise.promisifyAll(require('fs')),
  path = require('path'),
  _ = require('lodash'),
  Config = require(`${__dirname}/config.js`),
  specPaths = require(`${process.env.UTILS_FOLDER}//get_spec_paths.js`),
  this_script = path.basename(__filename, path.extname(__filename)),
  debug = require('debug')(`${Config.DEBUG_PREFIX}:${this_script}`),
  chalk = require('chalk'),
  {
    updateCollectionInfoBeforeUpload,
    getOptionsCollection,
    getOptionsEnvironment
  } = require(`${process.env.UTILS_FOLDER}/postman_request_options.js`)(Config),
  {
    indentationReplacer,
    writeJsonIndentation
  } = require(`${process.env.UTILS_FOLDER}/write-json-indentation.js`),
  //originalSpec = require(specPath),
  fetch = require('node-fetch');

let /* Postman Paths */
  {
    postmanSpecPath, // descargado de postman, lo que viene dentro de collection
    postmanForUploadPath,
    postmanIndentedSpecPath, // postman sólo reindentado
    postmanNormalizedPath, // swagger formateado como postman
    postmanConvertedPath: useThisOne // postman digerido por postman SDK (npm run inspect)
  } = specPaths;

function uploadThisOne(chosenPath, dryRun) {
  return Promise.resolve()
    .then(async function() {
      debug(`Will upload spec from file ${chalk.bold.yellow(chosenPath)}`);
      let pmCollection = require(chosenPath /*postmanIndentedSpecPath /* postmanAssimilatedPath */);

      pmCollection = pmCollection.collection
        ? pmCollection
        : {collection: pmCollection};

      let updatedInfo = updateCollectionInfoBeforeUpload(
          pmCollection.collection
        ),
        info = Object.assign(pmCollection.collection.info, updatedInfo);

      if (
        Config.POSTMAN_UPLOAD.includes('scripts') &&
        Config.POSTMAN_ENV === 'TEST'
      ) {
        const getCollectionScripts = require(path.resolve(
          `${process.env.UTILS_FOLDER}/get_collection_scripts.js`
        ));
        pmCollection.collection = getCollectionScripts(pmCollection.collection);
      }

      pmCollection.collection = Object.assign(
        {info},
        _.omit(pmCollection.collection, ['info'])
      );
      await writeJsonIndentation(postmanForUploadPath, pmCollection);

      debug(
        `uploading collection ${chalk.yellow(
          pmCollection.collection.info.name
        )} to (${chalk.yellow(Config.POSTMAN_COLLECTION_UID)})`
      );

      var putOptions = {
          ...getOptionsCollection(),
          method: 'PUT'
        },
        {url, method, headers} = putOptions,
        body = JSON.stringify(pmCollection);

      debug(putOptions);
      if (dryRun) {
        return {res: 'dryRun'};
      }

      return fetch(url, {method, headers, body})
        .then(res => {
          debug({ok: res.ok, status: res.status, statusText: res.statusText});
          return res;
        })
        .then(res => {
          return res.json();
        });
    })
    .then(async jsonRes => {
      debug(jsonRes);
    })
    .catch(err => {
      debug(err);
    });
}

uploadThisOne(useThisOne /*,*/, true);
