#!/usr/bin/env node
process.env.RETURN_INMEDIATELY = 1;

const Promise = require('bluebird'),
  fs = Promise.promisifyAll(require('fs')),
  path = require('path'),
  _ = require('lodash'),
  Config = require(`${__dirname}/config.js`),
  specPaths = require(`${process.env.UTILS_FOLDER}/get_spec_paths.js`),
  this_script = path.basename(__filename, path.extname(__filename)),
  debug = require('debug')(`${Config.DEBUG_PREFIX}:${this_script}`),
  chalk = require('chalk'),
  {
    indentationReplacer,
    writeJsonIndentation
  } = require(`${process.env.UTILS_FOLDER}/write-json-indentation.js`),
  {
    updateCollectionInfoBeforeUpload,
    getOptionsCollection,
    getOptionsEnvironment
  } = require(`${process.env.UTILS_FOLDER}/postman_request_options.js`)(Config),
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
async function downloadPostman() {
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
      let updatedInfo = updateCollectionInfoBeforeUpload(jsonRes.collection);

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
downloadPostman().catch(err => {
  debug(err);
});
module.exports = downloadPostman;
