const Promise = require('bluebird'),
  path = require('path'),
  this_script = path.basename(__filename, path.extname(__filename)),
  debug = require('debug')(`pm_sync:${this_script}`),
  _ = require('lodash'),
  swagger2Openapi = require('swagger2openapi'),
  fs = Promise.promisifyAll(require('fs')),
  yaml = require('js-yaml'),
  YAML = require('yaml');

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

/* Swagger Paths */
const normalizeYaml = async function normalizeYaml(
  rawFilePath,
  normalizedPath,
  stringified,
  openApiYamlSpecPath,
  enrichContent
) {
  let dir3upwards = path.dirname(
    path.dirname(path.dirname(path.dirname(rawFilePath)))
  );

  if (stringified && typeof stringified === 'string') {
    debug(
      `writing Raw Swagger YAML spec to ${rawFilePath.replace(dir3upwards, '')}`
    );
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

    debug(
      `writing normalized Swagger YAML spec to ${normalizedPath.replace(
        dir3upwards,
        ''
      )}`
    );
    await fs.writeFileAsync(normalizedPath, YAML.stringify(enrichedContent));

    return swagger2Openapi
      .convertObj(enrichedContent, {
        indent: ' ',
        outfile: openApiYamlSpecPath,
        yaml: true,
      })
      .then((result) => {
        debug(
          `writing openApi YAML spec version to  ${result.outfile.replace(
            dir3upwards,
            ''
          )}`
        );
        return fs.writeFileAsync(
          result.outfile,
          YAML.stringify(result.openapi)
        );
      })
      .catch((err) => {
        console.error(err);
        return;
      });
  });
};
module.exports = normalizeYaml;
