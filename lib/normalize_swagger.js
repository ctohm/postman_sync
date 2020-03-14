#!/usr/bin/env node
function normalizeSwagger(Config) {
  // normalize the configuration object
  Config = require(`${__dirname}/config.js`)(Config, __filename);

  const Promise = require('bluebird'),
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
      .sortBy(item => {
        return item.path;
      })
      .map(item => {
        return _.omit(item, ['method', 'path']);
      })
      .value();
  }

  /* Swagger Paths */
  async function normalizeYaml(
    rawFilePath,
    normalizedPath,
    stringified,
    enrichContent
  ) {
    if (stringified && typeof stringified === 'string') {
      await fs.writeFileAsync(
        rawFilePath,
        yaml.dump(JSON.parse(stringified)),
        'utf8'
      );
    }

    return fs.readFileAsync(rawFilePath).then(async function(file) {
      var yamlContent = file.toString('utf8');
      let content = YAML.parse(yamlContent);
      let enrichedContent = enrichContent(content);

      let methodsObj = _.chain(enrichedContent.paths)
        .reduce((accum0, props, pathname) => {
          let key = '## ' + pathname.split('/')[1];
          accum0 = accum0 || {};
          accum0[key] = accum0[key] || [];
          accum0[key] = parseMethodObjs(props, pathname, accum0[key]);

          return accum0;
        }, {})

        .value();
      await fs.writeFileAsync(normalizedPath, YAML.stringify(enrichedContent));

      return Converter.convert({
        from: 'swagger_2',
        to: 'openapi_3',
        syntax: 'yaml',

        source: normalizedPath
      }).then(function(converted) {
        return fs.writeFileAsync(
          normalizedPath.replace('swagger-', 'openapi-'),
          converted.stringify()
        );
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
      typeof swaggerObject !== 'object' &&
      swaggerObject.info
    ) {
      await fs.writeFileAsync(
        rawFilePath,
        JSON.stringify(swaggerObject, null, 2),
        'utf8'
      );
    }
    let content = require(rawFilePath);

    let enrichedContent = enrichContent(content, false);

    await fs.writeFileAsync(
      normalizedPath,
      JSON.stringify(enrichedContent, null, 2)
    );
    return Converter.convert({
      from: 'swagger_2',
      to: 'openapi_3',
      syntax: 'json',

      source: normalizedPath
    }).then(function(converted) {
      return fs.writeFileAsync(
        normalizedPath.replace('swagger-', 'openapi-'),
        converted.stringify()
      );
    });
  }
  const {
    swaggerYamlFirstExport,
    swaggerYamlNormalizedExport,
    swaggerJsonFirstExport,
    swaggerJsonNormalizedExport
  } = specPaths;

  return async ({
    swaggerObject,
    enrichContent = function(content) {
      return content;
    }
  }) => {
    let stringified = JSON.stringify(swaggerObject, null, 2);

    await normalizeYaml(
      swaggerYamlFirstExport,
      swaggerYamlNormalizedExport,
      stringified
    );

    await normalizeJson(
      swaggerJsonFirstExport,
      swaggerJsonNormalizedExport,
      swaggerObject
    );
    return;
  };
}
//writeJsonIndentation(jsonSchemaPath, convertedSchema).then(async () => {});

if (require.main === module) {
  normalizeSwagger(require(`${__dirname}/config.js`)(process.env));
  //  reduceCollections();
}
module.exports = normalizeSwagger;
