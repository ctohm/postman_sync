#!/usr/bin/env node

const Promise = require('bluebird'),
  path = require('path'),
  this_script = path.basename(__filename, path.extname(__filename)),
  debug = require('debug')(`pm_sync:${this_script}`),
  _ = require('lodash'),
  swagger2Openapi = require('swagger2openapi'),
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
  /*prunedOpenApiSchemaPath = openApiJsonSpecPath.replace(
      'openapi-spec',
      'openapi-schema'
    ),
    prunedOpenApiSchema = require(prunedOpenApiSchemaPath);*/

  if (
    swaggerObject &&
    typeof swaggerObject === 'object' &&
    swaggerObject.info
  ) {
    debug(
      `writing raw Swagger JSON spec to ${rawFilePath.replace(dir3upwards, '')}`
    );
    await fs.writeFileAsync(
      rawFilePath,
      JSON.stringify(swaggerObject, null, 2),
      'utf8'
    );
  } else {
    throw new Error(
      `normalizeJson: expects parameter "swaggerObject" to be an object
         with key "info". You passed a "${typeof stringified}"`
    );
  }
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
  await fs.writeFileAsync(
    normalizedPath,
    JSON.stringify(enrichedContent, null, 2)
  );

  return swagger2Openapi
    .convertObj(enrichedContent, {
      indent: ' ',
      outfile: openApiJsonSpecPath,
    })
    .then((result) => {
      return fs.writeFileAsync(
        openApiJsonSpecPath,
        JSON.stringify(result.openapi, null, 2)
      );
    })
    .catch((err) => {
      console.error(err);
      return;
    });
};
module.exports = normalizeJson;
