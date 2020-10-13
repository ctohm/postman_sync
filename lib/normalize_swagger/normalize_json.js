#!/usr/bin/env node

const Promise = require('bluebird'),
  path = require('path'),
  this_script = path.basename(__filename, path.extname(__filename)),
  debug = require('debug')(`pm_sync:${this_script}`),
  _ = require('lodash'),
  Converter = require('api-spec-converter'),
  fs = Promise.promisifyAll(require('fs'));
async function convertAndSave({from, to, syntax, source, savePath}) {
  let dir3upwards = path.dirname(
    path.dirname(path.dirname(path.dirname(savePath)))
  );

  return Converter.convert({
    from,
    to,
    syntax,
    source
  }).then(async function(convertedDef) {
    await convertedDef.fillMissing();

    let validResult = await convertedDef.validate(),
      {errors, warnings, ...result} = validResult;
    if (errors) {
      throw new Error(JSON.stringify(errors, null, 2));
    }
    if (warnings) {
      console.warn(JSON.stringify(warnings, null, 2));
    }
    debug(`writing ${to} JSON spec to  ${savePath.replace(dir3upwards, '')}`, {
      result
    });
    return fs.writeFileAsync(savePath, convertedDef.stringify());
  });
}
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

  return (
    convertAndSave({
      from: 'swagger_2',
      to: 'openapi_3',
      syntax: 'json',

      source: normalizedPath,
      savePath: openApiJsonSpecPath
    })
      /* .then(() => {
      return convertAndSave({
        to: 'swagger_2',
        from: 'openapi_3',
        syntax: 'json',

        source: prunedOpenApiSchemaPath,
        savePath: normalizedPath.replace(
          'swagger/swagger',
          'swagger/reverse.swagger'
        )
      });
    })*/
      .catch(err => {
        console.error(err);
        return;
      })
  );
};
module.exports = normalizeJson;
