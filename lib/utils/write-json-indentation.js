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
      console.warn({contents});
    }

    return (
      stringified
        .replace(/"\[\|/g, '["')
        .replace(/\|\]"/g, '"]')
        .replace(/\|,\|/g, '","')
        .replace(/et\('direccionesBorrables'/g, "et('direccionObj.Borrables'")
        //.replace(          /et\('direccionesNoBorrables'/g,          "et('direccionObj.NoBorrables'"        )
        //.replace(/et\('idDireccionEliminar'/g, "et('direccionObj.idEliminar'")
        //.replace(/et\('idDireccion'/g, "et('direccionObj.id'")
        //.replace(          /et\('idDireccionPorDefecto'/g,          "et('direccionObj.idPorDefecto'"        )
        //.replace(/et\('direcciones'/g, "et('direccionObj.direcciones'")
        //.replace(/{{direccionesBorrables}}/g, '{{direccionObj.Borrables}}')
        //.replace(/{{direccionesNoBorrables}}/g, '{{direccionObj.NoBorrables}}')
        //.replace(/{{idDireccionEliminar}}/g, '{{direccionObj.idEliminar}}')
        //.replace(/{{idDireccion}}/g, '{{direccionObj.id}}')
        //.replace(/{{idDireccionPorDefecto}}/g, '{{direccionObj.idPorDefecto}}')
        //.replace(/{{direcciones}}/g, '{{direccionObj.direcciones}}')

        //.replace(/botones/g, 'boton_All')
        //.replace(/cantidadProductos/g, 'producto_Cantidad')
        //.replace(/definition.Boton/g, 'boton_Definition')
        //.replace(/definition.Cliente/g, 'cliente_Definition')
        //.replace(/definition.Direccion/g, 'direccion_Definition')
        //.replace(/definition.Marca/g, 'marca_Definition')
        //.replace(/definition.Pedido/g, 'pedido_Definition')
        //.replace(/definition.Producto/g, 'producto_Definition')
        //.replace(/direcciones/g, 'direccion_All')
        //.replace(/emailCliente1/g, 'cliente_Email1')
        //.replace(/emailCliente8/g, 'cliente_Email8')
        //.replace(/idBoton/g, 'boton_id')
        //.replace(/idBotonDisponible/g, 'boton_idDisponible')
        //.replace(/idCategoria/g, 'categoria_id')
        //.replace(/idCliente/g, 'cliente_id')
        //.replace(/idDireccion/g, 'direccion_id')
        //.replace(/idMarca/g, 'marca_id')
        //.replace(/idMediopago/g, 'mediopago_id')
        //.replace(/idMediopagoDefault/g, 'mediopago_idDefault')
        //.replace(/idMediopagoEliminar/g, 'mediopago_idEliminar')
        //.replace(/idPedido/g, 'pedido_id')
        //.replace(/idPedidoFinalizado/g, 'pedido_idFinalizado')
        //.replace(/idPedidoVigenteFechaAnterior/g, 'pedido_idVigenteFechaAnterior')
        //.replace(/idProducto/g, 'producto_id')
        //.replace(/idProducto2/g, 'producto_id2')
        //.replace(/idProductoTipoBoton/g, 'producto_idTipoBoton')
        //.replace(/idTransaccion/g, 'transaccion_id')
        //.replace(/idVentana/g, 'ventana_id')
        //.replace(/idVentanasHorario/g, 'ventanas_idHorario')
        //.replace(/passwordCliente1/g, 'cliente_Password1')
        //.replace(/passwordCliente8/g, 'cliente_Password8')
        //.replace(/productoBoton/g, 'boton_Producto')
        //.replace(/productosAgregables/g, 'producto_Agregables')
        //.replace(/productosBoton70F11C0876FA/g, 'boton_Producto70F11C0876Fa')
        //.replace(/productosBoton70F11C087765/g, 'boton_Producto70F11C087765')
        //.replace(/productosBotonMD0100000001/g, 'boton_ProductoMd0100000001')
        //.replace(/ProductoTipoBoton/g, 'boton_ProductoTipo')
        //.replace(/tokenCliente/g, 'cliente_Token')
        //.replace(/transaccionFilter/g, 'transaccion_Filter')
        .replace(/wrongidBoton/g, 'boton_Wrongid')
    );
  }
  async function writeJsonIndentation(filepath, contents) {
    return fs
      .writeFileAsync(
        filepath,
        indentationReplacer(contents)
        //.replace(/\[\n\s+\{/g, '[{')
      )
      .then((res) => {
        debug(
          `Wrote ${chalk.green(
            filepath.replace(path.dirname(Config.OUTPUT_FOLDER), '')
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
