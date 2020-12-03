#!/usr/bin/env node
/// <reference types="newman" />
// @ts-check

const {Collection} = require('postman-collection');

/**
 * Modifies a Swagger2 spec according to a Postman Spec
 *
 * @param  {Object}           Config                        The configuration
 * @param  {Object}           arg2                    The argument 2
 * @param  {boolean}          arg2.dryRun          The dry run
 * @param  {Array<Object>}    arg2.relationsDictionary  Custom relationship dictionary
 * @param  {import('postman-collection').Collection.definition|null}  arg2.postmanSpec
 *                                                          file that contains it
 * @example
 *
 * ```js
 * exportToPostman({POSTMAN_COLLECTION_ID:...},
 *  {
 *    relationsDictionary:[
 *       fishes: {
 *         varName: 'fishId',
 *         descriptionName: 'Unique id for a Fish entity'
 *       },
 *    ]
 *  }
 * )
 * ``` (Otherwise, `getKeyAndDescription` function will infer `{varName: idFish, description: Fishes}`
 * @return {Promise}          { description_of_the_return_value }
 */
async function exportToPostman(
  Config,
  // @ts-ignore
  {dryRun = false, relationsDictionary = [], postmanSpec} = {}
) {
  // normalize the configuration object
  Config = require(`${__dirname}/config.js`)(Config, __filename);
  const Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),
    path = require('path'),
    _ = require('lodash'),
    chalk = require('chalk'),
    Converter = require('swagger2-postman2-parser'),
    specPaths = require(`${Config.UTILS_FOLDER}/get_spec_paths.js`)(Config),
    this_script = path.basename(__filename, path.extname(__filename)),
    debug = require('debug')(`pm_sync:${this_script}`),
    {
      indentationReplacer,
      writeJsonIndentation,
    } = require(`${Config.UTILS_FOLDER}/write-json-indentation.js`)(Config),
    normalizeCollectionIds = require(`${Config.UTILS_FOLDER}/normalize_collection_ids.js`)(
      Config
    );
  function capitalizeTxt(txt) {
    return txt.charAt(0).toUpperCase() + txt.slice(1); //or if you want lowercase the rest txt.slice(1).toLowerCase();
  }
  function getKeyAndDescription(keyword) {
    //debug(`getKeyAndDescription ${chalk.green(keyword)}`);
    return (
      relationsDictionary[
        _.deburr(keyword.toLowerCase()).replace(/s$/, '')
      ] || {
        varName: `id${capitalizeTxt(_.camelCase(keyword))}`,
        descriptionName: _.startCase(keyword),
      }
    );
  }

  /**
   *
   * @type {Record<string,string>}
   */
  let /* Swagger Paths */
    {
      swaggerAncestorPath,
      swaggerIndentedSpec,
      swaggerRawConvertedPath,
      swaggerSpecPath,
      swaggerConvertedPath,
      swaggerReducedPath,
      swaggerRoutesPath,
      swaggerAssimilatedPath,
    } = specPaths,
    /* Postman Paths */
    {
      postmanNormalizedPath,
      postmanRoutesPath,
      postmanAssimilatedPath,
      postmanAncestorPath,
      postmanIndentedSpecPath,
      postmanSpecPath,
      postmanConvertedPath,
      postmanReducedPath,
    } = specPaths;

  var postmanPaths = {},
    swaggerPaths = {},
    fileArray = [];
  let requestPaths = {};

  function fixUrlHost(url) {
    //url.raw = `${Config.API_PROTOCOL}://${Config.POSTMAN_API_HOST}/` + url.path.join('/');
    //url.protocol = Config.API_PROTOCOL;
    url.raw = `${Config.POSTMAN_API_HOST}/` + url.path.join('/');
    url.host = Config.POSTMAN_API_HOST.split('.');

    return url;
  }
  function apiStartsAt(url) {
    return url.path.indexOf('api');
  }

  function fixUrlParams(url) {
    let entityName,
      offSet = apiStartsAt(url);

    if (url.path[offSet + 2] === ':id') {
      entityName = url.path[offSet + 1];
      let singular = getKeyAndDescription(entityName);
      Object.assign(url.variable[0], {
        value: `{{${singular.varName}}}`,
        description: `id Único de ${singular.descriptionName}`,
      });
    }
    if (url.path[offSet + 4] === ':fk' || url.path[offSet + 5] === ':fk') {
      entityName = url.path[offSet + 3];
      let singular = getKeyAndDescription(entityName);
      Object.assign(url.variable[1], {
        value: `{{${singular.varName}}}`,
        description: `id Único de ${singular.descriptionName}`,
      });
    }
    entityName = entityName || url.path[offSet + 1];

    url.query = _.compact(
      _.map(url.query, (query) => {
        if (query.key === '') {
          return null;
        } else if (query.key === 'refresh') {
          return null;
        } else if (query.key === 'filter') {
          query.description =
            'Opcional, filtro en forma de String JSON encoded';
        } else if (query.key === 'where') {
          query.description =
            'Opcional, cláusula en forma de String JSON encoded';
        } else if (query.key === 'include') {
          query.description = 'Opcional, especifica campos relacionados';
        }
        return query;
      })
    );
    return {url: _.omit(fixUrlHost(url), ['protocol']), entityName};
  }

  function mergeResponseBodies(value, postmanItem, debugFN, method_path) {
    //////// Merge the request object
    let currentKeys;
    if (value.request.body.mode === 'raw') {
      currentKeys =
        typeof value.request.body.raw === 'object'
          ? _.keys(value.request.body.raw)
          : null;

      if (['PUT', 'POST', 'PATCH'].indexOf(value.request.method) !== -1) {
        debugFN(
          method_path,
          value.request.body.mode,
          value.request.body[value.request.body.mode]
          //, postManBody
        );
      }
    }

    if (
      postmanItem.request &&
      postmanItem.request.body &&
      postmanItem.request.body.raw
    ) {
      debug(
        `${chalk.red('postmanRaw')}:${
          postmanItem.request.body.raw
        } ,${currentKeys}, 'value.request.body.raw': ${value.request.body.raw}`
      );

      try {
        let postManBody =
          typeof postmanItem.request.body.raw === 'string'
            ? JSON.parse(postmanItem.request.body.raw)
            : postmanItem.request.body.raw;

        value.request.body = Object.assign(value.request.body, {
          mode: postmanItem.request.body.mode,
          raw: JSON.stringify(postManBody),
        });
        value.request.body = currentKeys.length
          ? _.pick(value.request.body, currentKeys)
          : value.request.body;
      } catch (err) {
        debugFN('line 158', err.message, postmanItem.request.body.raw);
      }
    }

    let swaggerExampleCodes = _.map(value.responses, (res) => {
        return String(res.code);
      }),
      postmanExampleCodes = _.map(postmanItem.responses, (pmres) => {
        pmres.example = true;
        return String(pmres.code);
      });
    let codesOnlyInPostman = _.difference(
        postmanExampleCodes,
        swaggerExampleCodes
      ),
      codesOnlyInSwagger = _.difference(
        swaggerExampleCodes,
        postmanExampleCodes
      ),
      postmanResponses = _.chain(postmanItem.responses)
        .map((pmres) => {
          // if(typeof pmres.body==='')

          try {
            let postManBody =
              typeof pmres.body === 'string' && pmres.body !== ''
                ? JSON.parse(pmres.body)
                : pmres.body;
            pmres.body = postManBody;
          } catch (err) {
            debugFN('line 302', err.message, pmres.body, method_path);
          }

          return pmres;
        })
        .value();
    if (codesOnlyInPostman.length || codesOnlyInSwagger.length) {
      debug({codesOnlyInPostman, codesOnlyInSwagger});
    }

    let swaggerResponses = _.reduce(
      value.responses,
      (accum, res) => {
        let postmanRes = postmanItem.responses.filter((pmres) => {
          pmres.example = true;
          let exists = String(pmres.code) === String(res.code);

          return exists;
        });

        /*if (method_path.indexOf('ventanasDireccion') !== -1) {
        debug({postmanRes});
      }*/

        if (postmanRes /*&& !res.example*/) {
          debugFN(res.code, method_path, _.map(postmanRes, 'body'));
          // debugFN({currentKeys, postmanRes});
          accum = accum.concat(postmanRes);

          // Only add local examples if they have 2xx or 3xx status codes
        } else if (/^[2|3]/.test(res.code)) {
          accum.push(res);
        }
        return accum;
      },
      []
    );
    let presentCodes = _.map(value.responses, 'code');

    postmanResponses = _.filter(postmanResponses, (pmres) => {
      return presentCodes.indexOf(pmres.code) === -1;
    });

    debugFN(presentCodes, _.map(postmanResponses, 'code'));
    return {swaggerResponses, postmanResponses};
  }

  /**
   * Función que indexa las llaves de una colección postman
   *
   * @param {Object}  elementWithItems  The element with items
   */
  function indexSpecKeys(elementWithItems, container) {
    _.each(elementWithItems.item, (value) => {
      //debug(elementWithItems.name, value.id);
      if (value.item) {
        if (value.method_path) {
          container[value.method_path] = _.pick(value, [
            'id',
            '_',
            '_postman_id',
            'method_path',
            'name',
          ]);
        }
        indexSpecKeys(value, container);
      } else {
        /*let method_path = [value.request.method]
        .concat(value.request.url.path)
        .join('/');*/
        if (value.request && value.request.url) {
          value.request.url = fixUrlHost(value.request.url);
          container[value.method_path] = container[value.method_path] || {
            suffix: 0,
          };
        }

        container[value.method_path].suffix++;
        if (container[value.method_path].suffix > 1) {
          debug(
            chalk.red(value.method_path) + 'EXISTE',
            container[value.method_path].suffix
          );
        }
        container[value.method_path] = Object.assign(
          container[value.method_path],
          value
        );
        let suffix = container[value.method_path].suffix;
        //container[`${value.method_path}|${suffix}`] = value;
      }
    });
  }

  /**
   * Función recursiva que va recorriendo los nodos de la conversión Swagger ->
   * Postman hasta llegar a la última rama, completándola con sus ancestros
   *
   * @param {Object}    elementWithItems  The element with items
   * @param {string[]}  breadcrumb        The breadcrumb
   * @param {boolean}    verbose          Wether to print debugFN messages or not
   */
  function unwrapItem(elementWithItems, breadcrumb, verbose) {
    let debugFN = verbose ? debug : function () {};
    //debug({elementWithItems});
    _.values(elementWithItems.item).forEach((value) => {
      let method_path = postmanPaths[value.method_path_multi]
        ? value.method_path_multi
        : value.method_path;
      let postmanItem = postmanPaths[method_path];
      if (postmanItem && postmanItem.id) {
        value.id = postmanItem.id;
        value._postman_id = value.id;
        value.name = postmanItem.name;
      }
      if (postmanItem && postmanItem._postman_id) {
        value._postman_id = postmanItem._postman_id;
      }
      if (value.item) {
        if (method_path.split('|').length > 1) {
          value._postman_isSubFolder = true;
        }

        debug('LINE 181', {method_path});
        return unwrapItem(value, breadcrumb.concat(value.name));
      }

      const raw =
        `${Config.POSTMAN_API_HOST}/` + value.request.url.path.join('/');

      if (value.request.url.path.slice(-1)[0] !== 'login') {
        value.request.header.push({
          key: 'Authorization',
          value: '{{accessToken}}',
          description: 'Access Token',
        });
      }

      value.request.name = value.request.name.replace('Botons', 'Botones');
      value.name = value.name.replace('Botons', 'Botones');
      // Se asegura que las respuestas posibles estén stringified
      value.request.header = _.uniqWith(value.request.header, _.isEqual);

      _.each(value.responses, (res) => {
        res._postman_previewlanguage = 'json';
        if (typeof res.body === 'object') {
          res.body = JSON.stringify(res.body);
        }
      });

      // Asigna valores a las variables de una URL basado en el modelo
      let {url, entityName} = fixUrlParams(value.request.url);

      value.request.url = url;
      value.request.method_path = value.method_path;

      if (!postmanItem) {
        return;
      }
      value.request.description =
        postmanItem.request.description || value.request.description;
      value.event = postmanItem.event;

      if (value.request.url) {
        //  _.extend(value.request.url.variable, postmanItem.request.url.variable);
      }
      _.extend(value.request.header, postmanItem.request.header);

      let {swaggerResponses, postmanResponses} = mergeResponseBodies(
        value,
        postmanItem,
        debugFN,
        method_path
      );

      value.responses = _.chain(swaggerResponses.concat(postmanResponses))
        .map((res) => {
          res.header = [];
          res.cookie = [];
          res.originalRequest.url = fixUrlHost(res.originalRequest.url);
          if (res.originalRequest.body && res.originalRequest.body.raw) {
            res.originalRequest.body.raw = res.originalRequest.body.raw
              .replace('"idBoton": ""', '"idBoton": "{{idBoton}}"')
              .replace('"idDireccion": ""', '"idDireccion": "{{idDireccion}}"')
              .replace(/":\s?-(\d{3})(\d{3})/g, '": $2');
          }
          res.body =
            typeof res.body !== 'string' ? JSON.stringify(res.body) : res.body;
          try {
            res.body = res.body.replace(/":\s?-(\d{3})(\d{3})/g, '": 1$2');
            res.body =
              res.body === 'string' && res.body !== ''
                ? JSON.parse(res.body)
                : res.body;
            return res;
          } catch (err) {
            debug({err, body: res.body});
            return res;
          }
        })
        .sortBy((res) => {
          return res.code;
        })
        .value();
      if (value.request.method !== 'POST') {
        value.responses = _.filter(value.responses, (res) => {
          return String(res.code) !== '422';
        });
      }
      debug(
        `L385 ${chalk.bold.cyan(entityName)} ${chalk.bold.green(
          method_path
        )} ${chalk.bold.red(raw)}`
      );

      value.request.url.raw = raw;
      return value;
    });
  }
  async function maybeSaveOrPrint(filePath, content) {
    if (dryRun) {
      console.log(
        `dry run. will print instead of savin to ${filePath}. Payload is`
      );
      console.log(content);
      return;
    }
    return writeJsonIndentation(filePath, content);
  }
  /**
   *
   * @param {import('openapi-types').OpenAPIV2.Document} swaggerObject
   * @param {import('postman-collection').Collection.definition} postmanObject
   */
  async function mergePostmanOntoSwagger(swaggerObject, postmanObject) {
    let originalInfo = _.cloneDeep(postmanObject.info),
      backup_filename = path.basename(
        postmanSpecPath,
        path.extname(postmanSpecPath)
      ),
      [hr, min] = new Date()
        .toISOString()
        .split(/:\d{2}\./)[0]
        .split(':'),
      backup_minute = [hr, parseInt(min / 5, 10) * 5].join('_');

    backup_filename = `${backup_filename}.${backup_minute}.json`;
    debug({backup_filename});

    await maybeSaveOrPrint(postmanSpecPath, _.cloneDeep(postmanObject));

    let validation = Converter.validate(swaggerObject);
    debug({validation});
    var conversionResult = Converter.convert(swaggerObject),
      pmCollection = {
        collection: {
          info: originalInfo,
        },
      };
    // Reindenta la colección postman
    let collectionFromSwaggerRaw = Object.assign(
        {info: originalInfo},
        _.omit(conversionResult.collection, ['info'])
      ),
      {parsedCollection: collectionFromSwagger} = normalizeCollectionIds(
        collectionFromSwaggerRaw
      );

    collectionFromSwagger = collectionFromSwagger.toJSON();
    await maybeSaveOrPrint(swaggerIndentedSpec, collectionFromSwagger);

    let {
      parsedCollection: normalizedSpec,
      methodPaths: postmanMethodPaths,
      ancestor: postmanAncestor,
    } = normalizeCollectionIds(postmanObject);

    await maybeSaveOrPrint(postmanIndentedSpecPath, normalizedSpec);

    normalizedSpec = normalizedSpec.toJSON();

    await maybeSaveOrPrint(postmanAncestorPath, postmanAncestor);
    let pmMethodFile = postmanRoutesPath.replace('.json', '_methodpaths.json');
    await maybeSaveOrPrint(pmMethodFile, postmanMethodPaths);
    //console.log(pretty(normalizedSpec.item));
    indexSpecKeys(normalizedSpec, postmanPaths);

    // Combina la colección de Postman existente con la que se generó de Swagger
    unwrapItem(collectionFromSwagger, [], false);

    Object.assign(pmCollection.collection, collectionFromSwagger);

    pmCollection.collection.event = normalizedSpec.event;
    pmCollection.collection.variable = normalizedSpec.variable;

    let info = {
      id: Config.POSTMAN_COLLECTION_ID,
      name: postmanObject.info.name || Config.POSTMAN_COLLECTION_NAME,
      _postman_id: Config.POSTMAN_COLLECTION_ID,
      description:
        postmanObject.info.description ||
        pmCollection.collection.info.description ||
        {},
      schema:
        'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    };
    // info.description.content = postmanObject.info.description;

    pmCollection.collection.info = info;

    // Guarda los endpoints presentes en postman
    await maybeSaveOrPrint(postmanRoutesPath, postmanPaths);

    // Guarda el spec swagger enriquecido con los ejemplos, pre-request-scripts y tests de Postman
    let {
      parsedCollection: finalCollection,
      methodPaths: swaggerMethodPaths,
    } = normalizeCollectionIds(pmCollection.collection);

    let normalizedSwaggerConversion = finalCollection.toJSON();

    indexSpecKeys(normalizedSwaggerConversion, swaggerPaths);

    // Combina la colección de Postman existente con la que se generó de Swagger
    //unwrapItem(collectionFromSwagger, []);
    await maybeSaveOrPrint(swaggerRoutesPath, swaggerPaths);
    let swMethodFile = swaggerRoutesPath.replace('.json', '_methodpaths.json');
    await maybeSaveOrPrint(swMethodFile, swaggerMethodPaths);
    let swaggerKeys = Object.keys(swaggerPaths).filter((key) => {
        return (
          ['DELETE', 'GET', 'PATCH', 'POST', 'PUT'].indexOf(
            key.split('|')[0]
          ) !== -1
        );
      }),
      swaggerKeysLength = swaggerKeys.length,
      postmanKeys = Object.keys(postmanPaths).filter((key) => {
        return (
          ['DELETE', 'GET', 'PATCH', 'POST', 'PUT'].indexOf(
            key.split('|')[0]
          ) !== -1
        );
      }),
      postmanKeysLength = postmanKeys.length;

    let routesOnlyInSwagger = _.difference(swaggerKeys, postmanKeys);
    let routesOnlyInPostman = _.difference(postmanKeys, swaggerKeys);

    debug({
      routesOnlyInSwagger,
      swaggerKeysLength,
      routesOnlyInPostman,
      postmanKeysLength,
    });

    finalCollection = Object.assign(
      {info: originalInfo},
      _.omit(normalizedSwaggerConversion, ['info', '_'])
    );

    await maybeSaveOrPrint(postmanNormalizedPath, {
      collection: finalCollection,
    });

    let {
      parsedCollection: finalCollection2,
      ancestor: swaggerAncestor,
    } = normalizeCollectionIds(normalizedSwaggerConversion);

    let normalizedSwaggerConversion2 = finalCollection2.toJSON();

    finalCollection2 = Object.assign(
      {info: originalInfo},
      _.omit(normalizedSwaggerConversion2, ['info', '_'])
    );

    await maybeSaveOrPrint(swaggerAncestorPath, swaggerAncestor);
    let pmNormalizedFile = postmanNormalizedPath.replace('.json', '_2.json');
    await maybeSaveOrPrint(pmNormalizedFile, {collection: finalCollection2});
    return;
  }

  return Promise.try(async () => {
    return;
  })
    .delay(1000)
    .then(async function () {
      const postmanObject =
        typeof postmanSpec === 'object'
          ? postmanSpec
          : require(postmanSpec || postmanSpecPath);

      const swaggerObject = require(swaggerSpecPath);

      return mergePostmanOntoSwagger(swaggerObject, postmanObject);
    })
    .catch((err) => {
      debug(err);
    });
}
if (require.main === module) {
  exportToPostman(require(`${__dirname}/config.js`)(process.env));
  //  reduceCollections();
}
module.exports = exportToPostman;
