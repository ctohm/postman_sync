#!/usr/bin/env node

process.env.DEBUG_COLORS = true;

const Promise = require('bluebird'),
  fs = Promise.promisifyAll(require('fs')),
  path = require('path'),
  _ = require('lodash'),
  specPaths = require(`${process.env.UTILS_FOLDER}/get_spec_paths.js`),
  Config = require(`${process.env.LIB_FOLDER}/config.js`),
  this_script = path.basename(__filename, path.extname(__filename)),
  debug = require('debug')(`${Config.DEBUG_PREFIX}:docs:${this_script}`),
  chalk = require('chalk'),
  enrichContent = require(`${process.env.UTILS_FOLDER}/enrich_content.js`),
  yaml = require('js-yaml'),
  lbApp = require(path.resolve(`${__dirname}/../server/server.js`)),
  createSwaggerObject = require('loopback-swagger').generateSwaggerSpec,
  YAML = require('yaml');

let /* Swagger Paths */
  {
    swaggerYamlFirstExport,
    swaggerYamlNormalizedExport,
    swaggerJsonFirstExport,
    swaggerJsonNormalizedExport
  } = specPaths;

var folderpath = path.resolve(`${__dirname}/../server/models`),
  fileArray = [];

async function normalizeSpecs() {
  return fs
    .readFileAsync(swaggerYamlFirstExport)
    .then(async function(file) {
      var yamlContent = file.toString('utf8');
      let content = YAML.parse(yamlContent),
        enrichedContent = enrichContent(content, false);
      enrichedContent.info.title = 'API MyDot YAML';

      let methodsObj = _.chain(enrichedContent.paths)
        .reduce((accum0, props, pathname) => {
          let key = '## ' + pathname.split('/')[1];
          accum0 = accum0 || {};
          accum0[key] = accum0[key] || [];
          accum0[key] = _.chain(props)
            .reduce((accum, methodProps, method) => {
              let entry = {};
              entry.path = pathname;
              entry.method = method;
              entry['#### ' + method.toUpperCase()] = pathname;
              entry['**summary**'] = methodProps.summary;

              accum.push(entry);

              return accum;
            }, accum0[key])
            .sortBy(item => {
              return item.path;
            })
            .map(item => {
              return _.omit(item, ['method', 'path']);
            })
            .value();

          return accum0;
        }, {})

        .value();

      return fs.writeFileAsync(
        swaggerYamlNormalizedExport,
        YAML.stringify(enrichedContent)
      );
    })
    .then(async function() {
      let content = require(swaggerJsonFirstExport);

      await fs.writeFileAsync(
        swaggerJsonFirstExport,
        JSON.stringify(content, null, 2)
      );

      let enrichedContent = enrichContent(content, false);

      return fs.writeFileAsync(
        swaggerJsonNormalizedExport,
        JSON.stringify(enrichedContent, null, 2)
      );
    })
    .catch(err => {
      debug(err);
    });
}

async function dumpDocs(loopbackApp) {
  var swaggerObject = createSwaggerObject(loopbackApp),
    stringified = JSON.stringify(swaggerObject, null, 2);
  if (Config.EXIT_EARLY) {
    debug('Exit early, just dumping specs');
    await fs.writeFileAsync(swaggerJsonFirstExport, stringified, 'utf8');
    await fs.writeFileAsync(
      swaggerYamlFirstExport,
      yaml.dump(JSON.parse(stringified)),
      'utf8'
    );
    await normalizeSpecs();
    return process.exit(0);
  }
}
dumpDocs(lbApp);
