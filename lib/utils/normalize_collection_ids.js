#!/usr/bin/env node

const Promise = require('bluebird'),
  fs = Promise.promisifyAll(require('fs')),
  path = require('path'),
  specPaths = require(`${process.env.UTILS_FOLDER}/get_spec_paths.js`),
  _ = require('lodash'),
  chalk = require('chalk'),
  Config = require(`${process.env.LIB_FOLDER}/config.js`),
  this_script = path.basename(__filename, path.extname(__filename)),
  debug = require('debug')(`${Config.DEBUG_PREFIX}:docs:${this_script}`),
  Converter = require('swagger2-postman2-parser'),
  {
    indentationReplacer,
    writeJsonIndentation
  } = require(`${process.env.UTILS_FOLDER}/write-json-indentation.js`),
  entityUtils = require(`${process.env.UTILS_FOLDER}/entity-utils.js`),
  pretty = function(obj) {
    // function to neatly log the collection object to console
    return require('util').inspect(obj, {colors: true});
  },
  PropertyList = require('postman-collection').PropertyList,
  Collection = require('postman-collection').Collection,
  ItemGroup = require('postman-collection').ItemGroup,
  methodPaths = {};

function unwrapPropertyList(
  maybeGroup,
  overWriteIds,
  removeIds,
  idMapping,
  ancestor
) {
  let method_path;
  if (PropertyList.isPropertyList(maybeGroup)) {
    //debug(chalk.bold.red('isPropertyList'), {maybeGroup});
    return maybeGroup.map(item => {
      return unwrapPropertyList(
        item,
        overWriteIds,
        removeIds,
        idMapping,
        ancestor
      );
    });
  } else if (ItemGroup.isItemGroup(maybeGroup)) {
    let parentArr = [];
    maybeGroup.forEachParent({withRoot: false}, parent => {
      parentArr.push(parent.name);
    });

    method_path = parentArr
      .reverse()
      .concat([maybeGroup.name])
      .join('|')
      .replace('{id}', ':id')
      .replace('{fk}', ':fk');

    methodPaths[method_path] = methodPaths[method_path] || [];
    methodPaths[method_path].push(maybeGroup.id);
    //methodPaths[method_path]++;
    //maybeGroup.method_path = `${method_path}|${methodPaths[method_path]}`;
    maybeGroup.method_path = method_path;
    ancestor[method_path] = ancestor[method_path] || {};
    if (overWriteIds) {
      maybeGroup.id = maybeGroup.method_path;
    }
    if (removeIds) {
      maybeGroup.id = undefined; // _.omit(maybeGroup, ['id']);
    }
    if (idMapping) {
      idMapping[maybeGroup.method_path] =
        idMapping[maybeGroup.method_path] || maybeGroup._;

      maybeGroup._ = idMapping[maybeGroup.method_path];
    }
    // debug(chalk.bold.cyan('isItemGroup'), maybeGroup._);
    return maybeGroup.items.map(item => {
      return unwrapPropertyList(
        item,
        overWriteIds,
        removeIds,
        idMapping,
        ancestor[method_path]
      );
    });
  } else {
    let withoutMethod = maybeGroup.request.url.path
      .join('|')
      .replace('{id}', ':id')
      .replace('{fk}', ':fk');
    if (!maybeGroup.request.method) {
      maybeGroup.no_method = true;
    }
    method_path = [maybeGroup.request.method]
      .concat(maybeGroup.request.url.path)
      .join('|');

    methodPaths[method_path] = methodPaths[method_path] || [];
    methodPaths[method_path].push(maybeGroup.id);
    maybeGroup.method_path = method_path; // `${method_path}|${      methodPaths[method_path].length    }`;

    if (overWriteIds) {
      maybeGroup.id = maybeGroup.method_path;
    }
    maybeGroup.protocolProfileBehavior = {
      disableBodyPruning: true
    };

    ancestor[withoutMethod] = ancestor[withoutMethod] || {};
    ancestor[withoutMethod][maybeGroup.id] = method_path;
    let suffix = _.size(ancestor[withoutMethod]);
    maybeGroup.method_path_multi = `${method_path}|${suffix}`;

    maybeGroup.responses = maybeGroup.responses.map((response, index) => {
      response.method_path = [
        maybeGroup.method_path,
        _.snakeCase(response.name).toUpperCase(),
        index
      ].join('|');
      if (overWriteIds) {
        response.id = response.method_path;
      }
      return response;
    });

    return maybeGroup;
  }
}

function normalizeCollectionIds(
  rawCollection,
  overWriteIds = false,
  removeIds = false,
  idMapping = false
) {
  let parsedCollection = new Collection(rawCollection),
    ancestor = {};

  unwrapPropertyList(
    parsedCollection.items,
    overWriteIds,
    removeIds,
    idMapping,
    ancestor
  );
  return {parsedCollection, idMapping, ancestor, methodPaths};
}

module.exports = normalizeCollectionIds;
