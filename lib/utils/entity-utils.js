const _ = require('lodash'),
  path = require('path'),
  specPaths = require(`${process.env.UTILS_FOLDER}/get_spec_paths.js`),
  Config = require(`${process.env.LIB_FOLDER}/config.js`),
  this_script = path.basename(__filename, path.extname(__filename)),
  debug = require('debug')(`${Config.DEBUG_PREFIX}:${this_script}`),
  chalk = require('chalk'),
  entityUtils = {
    capitalizeTxt: function(txt) {
      return txt.charAt(0).toUpperCase() + txt.slice(1); //or if you want lowercase the rest txt.slice(1).toLowerCase();
    },
    relationToModelMap: {
      mediopago: 'Medio de Pago',
      mediospago: 'Medios de Pago',
      fabricante: 'Fabricante',
      productos: 'Productos',
      marcas: 'Mascas',
      VentanaHorarias: 'Ventanas Horarias',
      ventanas_horario: 'Ventanas Horarias',
      ventanashorario: 'Ventanas Horarias',
      comunas_restringidas: 'Comunas Restringidas'
    },
    plurales: {
      boton: 'Botones',
      productos: 'Productos',
      ventanahoraria: 'Ventanas Horarias',
      productocategoria: 'Categorías de Producto'
    },
    articulo: {
      boton: 'un Botón',
      cliente: 'un Cliente',
      pedido: 'un Pedido',
      producto: 'un Producto',
      productocategoria: 'una Categoría de Producto',
      ventanahoraria: 'una Ventana Horaria',
      fabricante: 'un Fabricante',
      marca: 'una Marca',
      '#boton#': 'un Botón',
      '#cliente#': 'un Cliente',
      '#pedido#': 'un Pedido',
      '#producto#': 'un Producto',
      '#productocategoria#': 'una Categoría de Producto',
      '#fabricante#': 'un Fabricante',
      '#marca#': 'una Marca'
    },
    relationsDictionary: {
      boton: {
        varName: 'idBoton',
        descriptionName: 'Botón'
      },
      botone: {
        varName: 'idBoton',
        descriptionName: 'Botón'
      },
      direccione: {
        varName: 'idDireccion',
        descriptionName: 'Dirección'
      },

      producto: {
        varName: 'idProducto',
        descriptionName: 'Producto'
      },
      mediospago: {
        varName: 'idMedioPago',
        descriptionName: 'Medio de Pago'
      },
      ventanas_horario: {
        varName: 'idVentana',
        descriptionName: 'Ventana Horaria'
      },
      ventanashorario: {
        varName: 'idVentana',
        descriptionName: 'Ventana Horaria'
      },
      ventanahoraria: {
        varName: 'idVentana',
        descriptionName: 'Ventana Horaria'
      },
      productocategoria: {
        varName: 'idCategoria',
        descriptionName: 'Categoría de Producto'
      }
    },

    relationToSingular: function(keyword) {
      //debug(`relationToSingular ${chalk.green(keyword)}`);
      return (
        entityUtils.relationsDictionary[
          _.deburr(keyword.toLowerCase()).replace(/s$/, '')
        ] || {
          varName: `id${entityUtils.capitalizeTxt(_.camelCase(keyword))}`,
          descriptionName: _.startCase(keyword)
        }
      );
    },
    belongsToDictionary: {
      cliente: 'el Cliente asociado a',
      direccion: 'la Dirección asociada a',
      mediopago: 'el Medio de Pago asociado a',
      marca: 'la Marca de',
      direccion_default: 'la Dirección por Defecto de',
      mediopago_default: 'el Medio de Pago por defecto de',
      estado: 'el Estado Actual de',
      categoria: 'la Categoria de',
      despacho: 'el Despacho de',
      ventanahoraria: 'la Ventana Horaria de',
      fabricante: 'el Fabricante de'
    },

    replaceBelongsTo: function(description) {
      let relation = /(\|)([A-Za-z_]+)(\|)/.exec(description);

      //debug(        `${chalk.cyan(description)} replaceBelongsTo ${chalk.red(relation)}`      );
      if (!relation || !relation.length || !relation[2]) {
        return description;
      }
      let uglyrelation = _.deburr(relation[2].toLowerCase());

      if (entityUtils.belongsToDictionary[uglyrelation]) {
        return description.replace(
          /(\|)([A-Za-z_]+)(\|)/,
          entityUtils.belongsToDictionary[uglyrelation]
        );
      }

      return description.replace(/(\|)([A-Za-z_]+)(\|)/, '$2');
    },
    relationToModelname: function(description, verbose) {
      let relation = /(\|)([A-Za-z_]+)(\|)/.exec(description);
      if (!relation || !relation.length || !relation[2]) {
        return description;
      }
      let uglyrelation = _.deburr(relation[2].toLowerCase());
      if (verbose) {
        debug({description, uglyrelation});
      }

      if (entityUtils.relationToModelMap[uglyrelation]) {
        return description.replace(
          /(\|)([A-Za-z_]+)(\|)/,
          entityUtils.relationToModelMap[uglyrelation]
        );
      }

      return description.replace(/(\|)([A-Za-z_]+)(\|)/, '$2');
    },

    getPlural: function(entity) {
      return (
        entityUtils.plurales[
          _.deburr(entity.toLowerCase().replace(/s$/, ''))
        ] || entity + 's'
      );
    },

    getEntityWithArticle: function(entity) {
      return (
        entityUtils.articulo[entity.toLowerCase()] || `una entidad ${entity}`
      );
    }
  };

module.exports = entityUtils;
