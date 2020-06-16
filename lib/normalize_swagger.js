#!/usr/bin/env node
function normalizeSwagger(Config) {
  // normalize the configuration object
  Config = require(`${__dirname}/config.js`)(Config, __filename);

  const Promise = require('bluebird'),
    path = require('path'),
    this_script = path.basename(__filename, path.extname(__filename)),
    //debug = require('debug')(`pm_sync:${this_script}`),
    debug = require('debug')(`pm_sync:${this_script}`),
    _ = require('lodash'),
    Converter = require('api-spec-converter'),
    fs = Promise.promisifyAll(require('fs')),
    yaml = require('js-yaml'),
    //lbApp = require(serverPath),
    // createSwaggerObject = require('loopback-swagger').generateSwaggerSpec,
    YAML = require('yaml'),
    specPaths = require(`${Config.UTILS_FOLDER}/get_spec_paths.js`)(Config);
  function parseMethodObjs(props, pathname, startValue) {
    return _.chain(props)
      .reduce((accum, methodProps, method) => {
        let entry = {};
        entry.path = pathname;
        entry.method = method;
        entry['#### ' + method.toUpperCase()] = pathname;
        entry['**summary**'] = methodProps.summary;

        accum.push(entry);

        return accum;
      }, startValue)
      .sortBy((item) => {
        return item.path;
      })
      .map((item) => {
        return _.omit(item, ['method', 'path']);
      })
      .value();
  }
  let {
    openApiYamlSpecPath,
    openApiJsonSpecPath,
    jsonSchemaPath,
    jsonSchemaDereferencedPath,
  } = specPaths;
  /* Swagger Paths */
  async function normalizeYaml(
    rawFilePath,
    normalizedPath,
    stringified,
    enrichContent
  ) {
    debug(`Saving content to ${rawFilePath}`);
    if (stringified && typeof stringified === 'string') {
      console.log(`writing to ${rawFilePath}`);
      await fs.writeFileAsync(
        rawFilePath,
        yaml.dump(JSON.parse(stringified)),
        'utf8'
      );
    } else {
      throw new Error(
        `normalizeYaml expects parameter "stringified" to be a string. 
        You passed a "${typeof stringified}" `
      );
    }

    return fs.readFileAsync(rawFilePath).then(async function (file) {
      var yamlContent = file.toString('utf8');
      let content = YAML.parse(yamlContent);
      let enrichedContent =
        typeof enrichContent === 'function'
          ? enrichContent(content, false)
          : content;

      let methodsObj = _.chain(enrichedContent.paths)
        .reduce((accum0, props, pathname) => {
          let key = '## ' + pathname.split('/')[1];
          accum0 = accum0 || {};
          accum0[key] = accum0[key] || [];
          accum0[key] = parseMethodObjs(props, pathname, accum0[key]);

          return accum0;
        }, {})

        .value();
      debug(`writing to ${normalizedPath}`);
      await fs.writeFileAsync(normalizedPath, YAML.stringify(enrichedContent));

      return Converter.convert({
        from: 'swagger_2',
        to: 'openapi_3',
        syntax: 'yaml',

        source: normalizedPath,
      }).then(function (converted) {
        debug(`writing openApi version to `, {openApiYamlSpecPath});
        return fs.writeFileAsync(openApiYamlSpecPath, converted.stringify());
      });
    });
  }
  async function normalizeJson(
    rawFilePath,
    normalizedPath,
    swaggerObject,
    enrichContent
  ) {
    if (
      swaggerObject &&
      typeof swaggerObject === 'object' &&
      swaggerObject.info
    ) {
      debug(`writing to ${rawFilePath}`);
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
    debug(`writing to ${normalizedPath}`);
    await fs.writeFileAsync(
      normalizedPath,
      JSON.stringify(enrichedContent, null, 2)
    );
    return Converter.convert({
      from: 'swagger_2',
      to: 'openapi_3',
      syntax: 'json',

      source: normalizedPath,
    }).then(function (converted) {
      debug(`writing openApi version to `, {openApiJsonSpecPath});
      return fs.writeFileAsync(openApiJsonSpecPath, converted.stringify());
    });
  }
  const {
    swaggerYamlFirstExport,
    swaggerYamlNormalizedExport,
    swaggerJsonFirstExport,
    swaggerJsonNormalizedExport,
  } = specPaths;

  console.log({
    swaggerYamlFirstExport,
    swaggerYamlNormalizedExport,
    swaggerJsonFirstExport,
    swaggerJsonNormalizedExport,
  });

  return async ({
    swaggerObject,
    enrichContent = function (content) {
      return content;
    },
  }) => {
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
          stringified
        );
      })
      .delay(2000)
      .then(async () => {
        return normalizeJson(
          swaggerJsonFirstExport,
          swaggerJsonNormalizedExport,
          swaggerObject
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
}
//writeJsonIndentation(jsonSchemaPath, convertedSchema).then(async () => {});

if (require.main === module) {
  normalizeSwagger(require(`${__dirname}/config.js`)(process.env));
  //  reduceCollections();
}
module.exports = normalizeSwagger;
