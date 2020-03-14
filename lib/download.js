#!/usr/bin/env node

async function downloadPostman(Config) {
  const Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),
    path = require('path'),
    _ = require('lodash'),
    specPaths = require(`${Config.UTILS_FOLDER}/get_spec_paths.js`)(Config),
    this_script = path.basename(__filename, path.extname(__filename)),
    debug = require('debug')(`pm_sync:${this_script}`),
    chalk = require('chalk'),
    {
      indentationReplacer,
      writeJsonIndentation
    } = require(`${Config.UTILS_FOLDER}/write-json-indentation.js`)(Config),
    {
      getCollectionVersionAndInfo,
      getOptionsCollection,
      getOptionsEnvironment
    } = require(`${Config.UTILS_FOLDER}/postman_request_options.js`)(Config),
    fetch = require('node-fetch');
  /*
  const   transformer = require('api-spec-transformer'),
  postmanToSwagger = new transformer.Converter(
    transformer.Formats.POSTMAN,
    transformer.Formats.SWAGGER
  );
  postmanToSwagger.loadFile(postmanSpecPath, function(err) {
  if (err) {
    console.log(err.stack);
    return;
  }

  return postmanToSwagger.convert('json').then(function(convertedData) {
    return writeJsonIndentation(swaggerJsonFirstExport, convertedData);
  });
});*/

  let /* Postman Paths */
    {
      swaggerYamlFirstExport,
      swaggerJsonFirstExport,
      postmanIndentedSpecPath,
      postmanSpecPath,
      postmanEnvironmentPath
    } = specPaths;

  debug({postmanSpecPath, postmanIndentedSpecPath});

  // una copia de lo que se descarga desde postman

  return Promise.try(async () => {
    const requestOptionsCollection = getOptionsCollection();
    debug({requestOptionsCollection});
    let {url, method, headers} = requestOptionsCollection;
    return fetch(url, {method, headers});
  })
    .then(res => {
      debug({ok: res.ok, status: res.status, statusText: res.statusText});
      return res;
    })
    .then(res => {
      return res.json();
    })
    .then(async jsonRes => {
      let updatedInfo = getCollectionVersionAndInfo(jsonRes.collection);

      await writeJsonIndentation(postmanSpecPath, jsonRes.collection);
      return writeJsonIndentation(postmanIndentedSpecPath, jsonRes);
    })
    .delay(1000)
    .then(prerequest => {
      const requestOptionsEnvironment = getOptionsEnvironment();
      debug({requestOptionsEnvironment});

      let {url, method, headers} = requestOptionsEnvironment;
      return fetch(url, {method, headers});
    })
    .then(res => {
      debug({ok: res.ok, status: res.status, statusText: res.statusText});
      return res;
    })
    .then(res => {
      return res.json();
    })
    .then(async jsonRes => {
      return writeJsonIndentation(
        path.resolve(postmanEnvironmentPath),
        jsonRes.environment
      );
    });
}
if (require.main === module) {
  downloadPostman(require(`${__dirname}/config.js`)(process.env)).catch(err => {
    console.error(err);
  });
  //  reduceCollections();
}
module.exports = downloadPostman;
