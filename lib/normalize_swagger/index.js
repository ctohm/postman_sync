#!/usr/bin/env node
/// <reference types="newman" />
// @ts-check
function normalizeSwagger(Config) {
  const path = require('path');
  // normalize the configuration object
  Config = require(path.resolve(`${__dirname}/../config.js`))(
    Config,
    __filename
  );

  const Promise = require('bluebird'),
    this_script = path.basename(__filename, path.extname(__filename)),
    debug = require('debug')(`pm_sync:${this_script}`),
    _ = require('lodash'),
    specPaths = require(`${Config.UTILS_FOLDER}/get_spec_paths.js`)(Config),
    normalizeJson = require(`${__dirname}/normalize_json.js`),
    normalizeYaml = require(`${__dirname}/normalize_yaml.js`);

  /**
   * @type {Record<string,string>} paths
   */
  const {
    openApiYamlSpecPath,
    openApiJsonSpecPath,
    swaggerYamlFirstExport,
    swaggerYamlNormalizedExport,
    swaggerJsonFirstExport,
    swaggerJsonNormalizedExport,
  } = specPaths;

  console.log({
    openApiYamlSpecPath,
    openApiJsonSpecPath,
    swaggerYamlFirstExport,
    swaggerYamlNormalizedExport,
    swaggerJsonFirstExport,
    swaggerJsonNormalizedExport,
  });
  /**
   *
   * @typedef {Object} normalizeSwaggerParams
   * @property {import('openapi-types').OpenAPIV2.Document} swaggerObject
   * @property {Function} enrichContent
   */

  /**
   *
   * @param {normalizeSwaggerParams} param0
   */
  const normalizeSwaggerFunction = async function ({
    swaggerObject,
    enrichContent = function (content) {
      return content;
    },
  }) {
    swaggerObject.consumes = [
      'application/json',
      'application/x-www-form-urlencoded',
    ];
    swaggerObject.produces = ['application/json', 'text/xml'];

    return Promise.try(async () => {
      debug({
        enricherFunction: enrichContent,
        typeofSwaggerObject: typeof swaggerObject,
      });

      return JSON.stringify(swaggerObject, null, 2);
    })
      .delay(2000)
      .then((stringified) => {
        debug({typeofStringified: typeof stringified});
        return normalizeYaml(
          swaggerYamlFirstExport,
          swaggerYamlNormalizedExport,
          stringified,
          openApiYamlSpecPath
        );
      })
      .delay(2000)
      .then(async () => {
        return normalizeJson(
          swaggerJsonFirstExport,
          swaggerJsonNormalizedExport,
          swaggerObject,
          openApiJsonSpecPath
        );
      })
      .delay(2000)
      .then(async () => {
        return;
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  };
  return normalizeSwaggerFunction;
}

//writeJsonIndentation(jsonSchemaPath, convertedSchema).then(async () => {});

if (require.main === module) {
  normalizeSwagger(require(`${__dirname}/config.js`)(process.env));
  //  reduceCollections();
}
module.exports = normalizeSwagger;
