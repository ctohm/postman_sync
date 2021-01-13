#!/usr/bin/env node

const Promise = require('bluebird'),
  path = require('path'),
  this_script = path.basename(__filename, path.extname(__filename)),
  debug = require('debug')(`pm_sync:${this_script}`),
  _ = require('lodash'),
  swagger2Openapi = require('swagger2openapi'),
  writeJsonIndentation = require('../utils/write-json-indentation'),
  fs = Promise.promisifyAll(require('fs'));

const normalizeJson = async function normalizeJson(
  rawFilePath,
  normalizedPath,
  swaggerObject,
  openApiJsonSpecPath,
  enrichContent
) {
  let dir3upwards = path.dirname(
    path.dirname(path.dirname(path.dirname(rawFilePath)))
  );
  return Promise.try(() => {
    if (
      swaggerObject &&
      typeof swaggerObject === 'object' &&
      swaggerObject.info
    ) {
      debug(
        `writing raw Swagger JSON spec to ${rawFilePath.replace(
          dir3upwards,
          ''
        )}`
      );

      return writeJsonIndentation(rawFilePath, swaggerObject);
    } else {
      throw new Error(
        `normalizeJson: expects parameter "swaggerObject" to be an object
         with key "info". You passed a "${typeof stringified}"`
      );
    }
  })
    .then(() => {
      let content = require(rawFilePath);

      let enrichedContent =
        typeof enrichContent === 'function'
          ? enrichContent(content, false)
          : content;
      debug(
        `writing normalized Swagger JSON spec to ${normalizedPath.replace(
          dir3upwards,
          ''
        )}`
      );
      return enrichedContent;
      return fs
        .writeFileAsync(
          normalizedPath,
          JSON.stringify(enrichedContent, null, 2)
        )
        .then(() => {
          return enrichedContent;
        });
    })
    .then(async (enrichedContent) => {
      return swagger2Openapi.convertObj(enrichedContent, {
        indent: ' ',
        outfile: openApiJsonSpecPath,
      });
    })
    .then((result) => {
      console.info({wroteTo: openApiJsonSpecPath});
      return writeJsonIndentation(openApiJsonSpecPath, result.openapi);
    })
    .catch((err) => {
      console.error(err.message);
      console.log('error on ' + __filename);
      return;
    });
};
module.exports = normalizeJson;
