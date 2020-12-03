#!/usr/bin/env node
function indentationUtils(Config) {
  const Promise = require('bluebird'),
    _ = require('lodash'),
    fs = Promise.promisifyAll(require('fs')),
    path = require('path'),
    specPaths = require(`${Config.UTILS_FOLDER}/get_spec_paths.js`)(Config),
    this_script = path.basename(__filename, path.extname(__filename)),
    debug = require('debug')(`pm_sync:${this_script}`),
    chalk = require('chalk');

  function replaceKeys(keys) {
    const plurales = {
        botones: 'boton',
        direcciones: 'direccion',
        mediospago: 'mediopago',
        pedidos: 'pedido',
        productos: 'producto',
      },
      entities = {
        boton: 'boton',

        categoria: 'categoria',
        cliente: 'cliente',

        direccion: 'direccion',
        marca: 'marca',
        mediopago: 'mediopago',

        pedido: 'pedido',
        producto: 'producto',

        transaccion: 'transaccion',
        ventana: 'ventana',
      };
    keys = keys.map(({key, to_key}) => {
      to_key = _.snakeCase(key);
      _.each(plurales, (fixed, haystack) => {
        to_key = to_key.replace(haystack, fixed);
      });
      let entitykeys = Object.keys(entities),
        tokeyArr = to_key.split('_');

      if (/^id/.test(key)) {
        let [id, entity, ...others] = _.snakeCase(key).split('_');
        debug(_.snakeCase(key));
        to_key = entity + '.' + _.camelCase([id, ...others].join('_'));
      } else {
        console.log({tokeyArr, to_key});

        for (let entitykey of entitykeys) {
          if (tokeyArr.includes(entitykey)) {
            to_key = _.camelCase(to_key.replace(entitykey, ''));
            to_key =
              entitykey +
              '.' +
              (to_key.charAt(0).toUpperCase() + to_key.slice(1) || 'All');
            break;
          }
        }
      }
      to_key = to_key.charAt(0).toLowerCase() + to_key.slice(1);
      return {key, to_key};
    });
    console.log(
      keys
        .filter((key) => {
          return !key.to_key.includes('.');
        })
        .map((key) => key.to_key)
    );
    console.log(
      _.sortBy(
        keys.filter(
          (key) => {
            return key.to_key.includes('.');
          },
          (item) => item.to_key
        )
      ).map((item) => {
        return `.replace(/${item.key}/g,"${item.to_key.replace('.', '_')}")`;
      })
    );
  }

  function indentationReplacer(contents) {
    let stringified = JSON.stringify(
      contents,
      function (keyname, value) {
        if (
          ['path', 'host'].indexOf(keyname) !== -1 &&
          value instanceof Array
        ) {
          return '[|' + value.join('|,|') + '|]';
        } else if (
          keyname === 'description' &&
          typeof value === 'object' &&
          value.content
        ) {
          return value.content;
        } else if (keyname === 'exec' && Array.isArray(value)) {
          return value
            .join('¬')
            .replace(/\/\*[^*]+\*\//g, '')
            .split('¬');
        } else if (keyname === 'postman_previewlanguage') {
          return 'json';
        } else if (keyname === 'response' && value instanceof Array) {
          return _.chain(value)
            .sortBy((res) => {
              return res.code;
            })
            .filter((res) => {
              return res.code !== 403 && res.code !== 400;
            })
            .map((res) => {
              res.header = [];
              res._postman_previewlanguage = 'json';
              return res;
            })
            .value();
        }
        return value;
      },
      2
    );
    if (!stringified) {
      throw new Error('Tried to stringify undefined');
      console.warn({contents});
      return JSON.stringify(contents);
    }

    return stringified
      .replace(/"\[\|/g, '["')
      .replace(/\|\]"/g, '"]')
      .replace(/\|,\|/g, '","')
      .replace(/et\('direccionesBorrables'/g, "et('direccionObj.Borrables'")
      .replace(/wrongidBoton/g, 'boton_Wrongid');
  }
  async function writeJsonIndentation(filepath, contents) {
    if (!contents) {
      throw new Error('writeJsonIndentation: no contents');
    }
    return fs
      .writeFileAsync(
        filepath,
        indentationReplacer(contents)
        //.replace(/\[\n\s+\{/g, '[{')
      )
      .then((res) => {
        debug(
          `Wrote ${chalk.green(
            filepath.replace(path.dirname(Config.OUTPUT_FOLDER), '.')
          )}`
        );
        return;
      })
      .catch((err) => {
        debug(err);
        return;
      });
  }
  return {writeJsonIndentation, indentationReplacer};
}
module.exports = indentationUtils;
