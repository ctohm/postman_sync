#!/usr/bin/env node

async function downloadFromPostman(Config, {dryRun = false} = {}) {
  // normalize the configuration object
  Config = require(`${__dirname}/config.js`)(Config, __filename);
  const path = require('path'),
    this_script = path.basename(__filename, path.extname(__filename)),
    debug = require('debug')(`pm_sync:${this_script}`),
    Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),
    _ = require('lodash'),
    specPaths = require(`${Config.UTILS_FOLDER}/get_spec_paths.js`)(Config),
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
  let responses = {};

  function downloadEnvironment() {
    return Promise.try(async () => {
      const requestOptionsEnvironment = getOptionsEnvironment();

      let {url, method, headers} = requestOptionsEnvironment;

      debug({requestOptionsEnvironment});
      if (!url || !method || !headers) {
        console.info('Environment will not be requested. Config is', {
          url: url || 'missing',
          method: method || 'missing',
          headers: headers || 'missing'
        });
        throw new Error('Missing params');
      }
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
        if (dryRun) {
          return jsonRes;
        }
        return writeJsonIndentation(
          path.resolve(postmanEnvironmentPath),
          jsonRes.environment
        );
      })
      .delay(1000)
      .then(jsonRes => {
        if (dryRun) {
          console.log('dry run. Response was');
          console.log(jsonRes);
        }
      })
      .catch(err => {
        console.error(err);
        return Promise.reject(err);
      });
  }

  function downloadCollection() {
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
        if (dryRun) {
          responses.collection = jsonRes;
          return jsonRes;
        }
        await writeJsonIndentation(postmanSpecPath, jsonRes.collection);
        return writeJsonIndentation(postmanIndentedSpecPath, jsonRes);
      })
      .delay(1000)
      .then(jsonRes => {
        if (dryRun) {
          console.log('dry run. Response was');
          console.log(jsonRes);
        }
      })
      .catch(err => {
        console.error(err);
        return Promise.reject(err);
      });
  }

  return Promise.try(async () => {
    return downloadCollection();
  })
    .delay(1000)
    .then(() => {
      return downloadEnvironment();
    })
    .catch(err => {
      console.error(err);
      return;
    });
}
if (require.main === module) {
  downloadFromPostman(require(`${__dirname}/config.js`)(process.env)).catch(
    err => {
      console.error(err);
    }
  );
  //  reduceCollections();
}
module.exports = downloadFromPostman;
