function enrichContent({Config, content, verbose}) {
  const Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),
    path = require('path'),
    _ = require('lodash'),
    specPaths = require(`${Config.UTILS_FOLDER}/get_spec_paths.js`)(Config)(
      Config
    ),
    this_script = path.basename(__filename, path.extname(__filename)),
    debug = require('debug')(`postman_synchronizer:${this_script}`),
    chalk = require('chalk'),
    responsesUtils = require(`${Config.UTILS_FOLDER}/responses-utils.js`)(
      Config
    ),
    replaceSummary = require(`${Config.UTILS_FOLDER}/replace_summary.js`);

  let Boton = {
      additionalProperties: false,
      description: 'Los botones de un Cliente',
      properties: {
        comment: {
          description: 'Comentario arbitrario en esta entidad',
          maxLength: 512,
          type: 'string'
        },
        id: {
          maxLength: 12,
          pattern: '[0-9A-F]{12}',
          type: 'string'
        },
        idCliente: {
          description: 'ID del cliente que compró este dot',
          format: 'integer',
          maxLength: 7,
          maximum: 10000,
          minimum: 1,
          pattern: '\\d{3}',
          type: 'number'
        },
        idDireccion: {
          description: 'Dirección de despacho asociada a este botón',
          format: 'integer',
          maxLength: 7,
          maximum: 10000,
          minimum: 1,
          pattern: '\\d{3}',
          type: 'number'
        },
        idMarca: {
          description: 'Marca que limita los productos de este botón',
          format: 'integer',
          maxLength: 7,
          maximum: 10000,
          minimum: 1,
          pattern: '\\d{3}',
          type: 'number'
        },
        idMediopago: {
          description: 'Medio de pago asociado a este botón',
          format: 'integer',
          maxLength: 7,
          maximum: 10000,
          minimum: 1,
          pattern: '\\d{3}',
          type: 'number'
        },
        isActive: {
          default: true,
          type: 'boolean'
        },
        nombreMarca: {
          description: 'Marca del botón',
          maxLength: 64,
          type: 'string'
        },
        saldo: {
          default: 5000,
          description: 'Saldo a favor cargado en el botón',
          format: 'integer',
          maxLength: 5,
          maximum: 99999,
          minimum: 0,
          pattern: '\\d{5}',
          type: 'number'
        },
        ssid: {
          description: 'SSID de la wifi asociada al botón',
          maxLength: 128,
          type: 'string'
        }
      },
      required: ['id', 'idCliente'],
      type: 'object'
    },
    Cliente = {
      additionalProperties: false,
      description:
        'Usuarios finales del servicio myDot. Tienen la App instalada en su dispositivo',
      properties: {
        apellido: {
          maxLength: 128,
          type: 'string'
        },
        avatar: {
          default: 'https://static.mydot.app/avatar.png',
          maxLength: 512,
          type: 'string'
        },
        despachoGratis: {
          default: 1,
          format: 'integer',
          maxLength: 1,
          type: 'number'
        },
        email: {
          format: 'email',
          maxLength: 36,
          type: 'string'
        },
        id: {
          format: 'integer',
          maxLength: 7,
          maximum: 10000,
          minimum: 1,
          pattern: '\\d{3}',
          type: 'number'
        },
        id_direccion_default: {
          format: 'integer',
          maxLength: 7,
          maximum: 10000,
          minimum: 1,
          pattern: '\\d{3}',
          type: 'number'
        },
        id_mediopago_default: {
          format: 'integer',
          maxLength: 7,
          maximum: 10000,
          minimum: 1,
          pattern: '\\d{3}',
          type: 'number'
        },
        rut: {
          maxLength: 12,
          pattern: '\\d{1,2}\\.{0,1}\\d{3}\\.{0,1}\\d{3}-[0-9Kk]',
          type: 'string'
        },
        telefono: {
          maxLength: 15,
          pattern: '^56\\d{1} \\d{4} \\d{4}$',
          type: 'string'
        },
        updatedAt: {
          format: 'date-time',
          type: 'string'
        },
        username: {
          maxLength: 128,
          type: 'string'
        }
      },
      required: ['email'],
      type: 'object'
    },
    Direccion = {
      additionalProperties: false,
      description: 'Las direcciones de un Cliente',
      properties: {
        comuna: {
          maxLength: 64,
          type: 'string'
        },
        conCobertura: {
          default: false,
          type: 'boolean'
        },
        direccion: {
          maxLength: 65535,
          type: 'string'
        },
        geom: {
          properties: {
            lat: {
              type: 'number'
            },
            lng: {
              type: 'number'
            }
          },
          type: 'object'
        },
        id: {
          format: 'integer',
          maxLength: 7,
          maximum: 10000,
          minimum: 1,
          pattern: '\\d{3}',
          type: 'number'
        },
        idCliente: {
          format: 'integer',
          maxLength: 7,
          maximum: 10000,
          minimum: 1,
          pattern: '\\d{3}',
          type: 'number'
        },
        instrucciones: {
          description:
            'Indicaciones para llegar, despachar, etc a esta dirección',
          type: 'string'
        },
        lat: {
          default: -70.38,
          format: 'float',
          maxLength: 7,
          maximum: 80,
          minimum: -80,
          type: 'number'
        },
        link: {
          type: 'string'
        },
        lng: {
          default: -30.78,
          format: 'float',
          maxLength: 7,
          maximum: 80,
          minimum: -80,
          type: 'number'
        },
        numero: {
          description:
            'Si aplica, el depto, oficina, letra o numeración interior',
          maxLength: 512,
          type: 'string'
        },
        pais: {
          maxLength: 64,
          type: 'string'
        },
        region: {
          maxLength: 128,
          type: 'string'
        }
      },
      required: ['direccion', 'lng', 'lat'],
      type: 'object'
    },
    Marca = {
      additionalProperties: false,
      description: 'Marcas de producto (pueden ser de un mismo fabricante)',
      properties: {
        categoriaPrincipal: {
          maxLength: 64,
          type: 'string'
        },
        id: {
          format: 'integer',
          maxLength: 7,
          maximum: 10000,
          minimum: 1,
          pattern: '\\d{3}',
          type: 'number'
        },
        idFabricante: {
          format: 'integer',
          type: 'number'
        },
        image: {
          maxLength: 512,
          type: 'string'
        },
        nombreMarca: {
          maxLength: 65535,
          type: 'string'
        }
      },
      required: ['id', 'nombreMarca', 'idFabricante'],
      type: 'object'
    },
    MedioPago = {
      additionalProperties: false,
      description: 'Los medios de pago de un Cliente',
      properties: {
        creditCardType: {
          default: 'Visa',
          type: 'string'
        },
        id: {
          format: 'integer',
          maxLength: 7,
          maximum: 10000,
          minimum: 1,
          pattern: '\\d{3}',
          type: 'number'
        },
        idCliente: {
          format: 'integer',
          maxLength: 7,
          maximum: 10000,
          minimum: 1,
          pattern: '\\d{3}',
          type: 'number'
        },
        idEstado: {
          default: 1,
          format: 'integer',
          maxLength: 2,
          type: 'number'
        },
        last4CardDigits: {
          maxLength: 4,
          pattern: '\\d{4}',
          type: 'string'
        },
        nombreEstado: {
          type: 'string'
        },
        numero: {
          maxLength: 20,
          pattern: '\\*{4} \\*{4} \\*{4} \\d{4}',
          type: 'string'
        },
        ordenCompra: {
          type: 'string'
        },
        responseCode: {
          type: 'string'
        },
        responseMessage: {
          maxLength: 65535,
          type: 'string'
        },
        username: {
          type: 'string'
        }
      },
      type: 'object'
    },
    NotificationToken = {
      additionalProperties: false,
      properties: {
        access_token: {
          type: 'string'
        },
        config_props: {
          type: 'object'
        },
        createdAt: {
          format: 'date-time',
          type: 'string'
        },
        deviceId: {
          type: 'string'
        },
        idCliente: {
          format: 'double',
          type: 'number'
        },
        platform: {
          type: 'string'
        },
        topic: {
          type: 'string'
        },
        updatedAt: {
          format: 'date-time',
          type: 'string'
        }
      },
      required: ['deviceId'],
      type: 'object'
    },
    Pedido = {
      additionalProperties: false,
      description:
        'Pedido generado por Botón o App. Sólo visible para Cliente dueño y Operadores',
      properties: {
        costoDespacho: {
          default: 0,
          description:
            'Costo del despacho, a priori cero para pedidos cuyo neto es mayor a 10.000',
          format: 'integer',
          maxLength: 7,
          maximum: 250000,
          minimum: 0,
          pattern: '\\d{6}',
          type: 'number'
        },
        createdAt: {
          format: 'date-time',
          type: 'string'
        },
        descuento: {
          default: 0,
          description:
            'Descuento aplicado por promociones o saldo a favor en el Botón',
          format: 'integer',
          maxLength: 7,
          maximum: 250000,
          minimum: 0,
          pattern: '\\d{6}',
          type: 'number'
        },
        descuento_primer_pedido: {
          default: 0,
          description:
            'Descuento aplicado sobre el despacho en el primer pedido del cliente',
          format: 'integer',
          maxLength: 7,
          maximum: 250000,
          minimum: 0,
          pattern: '\\d{6}',
          type: 'number'
        },
        id: {
          format: 'integer',
          maxLength: 5,
          maximum: 10000,
          minimum: 1,
          pattern: '\\d{3}',
          type: 'number'
        },
        idBoton: {
          maxLength: 12,
          pattern: '[0-9A-F]{12}',
          type: 'string'
        },
        idCliente: {
          description:
            'ID del cliente que gatilla el pedido (se lee del token)',
          format: 'integer',
          maxLength: 7,
          maximum: 10000,
          minimum: 1,
          pattern: '\\d{3}',
          type: 'number'
        },
        idDireccion: {
          format: 'integer',
          maxLength: 7,
          maximum: 10000,
          minimum: 1,
          pattern: '\\d{3}',
          type: 'number'
        },
        idEstado: {
          format: 'integer',
          maxLength: 7,
          maximum: 9,
          minimum: 1,
          pattern: '\\d{1}',
          type: 'number'
        },
        idMarca: {
          description: 'Marca que limita los productos de este botón',
          format: 'integer',
          maxLength: 7,
          maximum: 10000,
          minimum: 1,
          pattern: '\\d{3}',
          type: 'number'
        },
        idMediopago: {
          format: 'integer',
          maxLength: 7,
          maximum: 10000,
          minimum: 1,
          pattern: '\\d{3}',
          type: 'number'
        },
        idProducto: {
          format: 'integer',
          maxLength: 5,
          maximum: 10000,
          minimum: 1,
          pattern: '\\d{3}',
          type: 'number'
        },
        idTransaccion: {
          format: 'integer',
          maxLength: 16,
          maximum: 8565073562300389,
          minimum: 1565000000000001,
          pattern: '\\d{16}',
          type: 'number'
        },
        nombreMarca: {
          description: 'Marca del los productos del pedido',
          maxLength: 64,
          type: 'string'
        },
        precioNeto: {
          description:
            'Precio neto, igual a la suma de los productos que componen el pedido',
          format: 'integer',
          maxLength: 7,
          maximum: 250000,
          minimum: 1,
          pattern: '\\d{6}',
          type: 'number'
        },
        precioTotal: {
          description:
            'Precio a pagar por el pedido = (precio neto + costo despacho - descuento)',
          format: 'integer',
          maxLength: 7,
          maximum: 250000,
          minimum: 1,
          pattern: '\\d{6}',
          type: 'number'
        },
        updatedAt: {
          format: 'date-time',
          type: 'string'
        }
      },
      type: 'object'
    },
    Producto = {
      additionalProperties: false,
      description: 'Los productos disponibles para comprar',
      properties: {
        descripcion: {
          maxLength: 65535,
          type: 'string'
        },
        descuento: {
          format: 'integer',
          maxLength: 7,
          maximum: 10000,
          minimum: 0,
          pattern: '\\d{3}',
          type: 'number'
        },
        id: {
          format: 'integer',
          maxLength: 7,
          maximum: 10000,
          minimum: 1,
          pattern: '\\d{3}',
          type: 'number'
        },
        idCategoria: {
          format: 'integer',
          maxLength: 7,
          maximum: 10000,
          minimum: 1,
          type: 'number'
        },
        idMarca: {
          format: 'integer',
          maxLength: 7,
          maximum: 10000,
          minimum: 1,
          type: 'number'
        },
        image: {
          format: 'uri',
          maxLength: 512,
          type: 'string'
        },
        isButton: {
          description: 'Define si el producto es un botón o un consumible',
          type: 'boolean'
        },
        nombreMarca: {
          description: 'Marca del producto',
          maxLength: 64,
          type: 'string'
        },
        nombre_categoria: {
          maxLength: 64,
          type: 'string'
        },
        precioBase: {
          format: 'integer',
          maxLength: 7,
          maximum: 10000,
          minimum: 1,
          pattern: '\\d{3}',
          type: 'number'
        },
        sku: {
          format: '[A-Z]{5,8}00\\w{2}',
          maxLength: 24,
          type: 'string'
        }
      },
      required: [
        'id',
        'descripcion',
        'idCategoria',
        'idMarca',
        'precioBase',
        'descuento'
      ],
      type: 'object'
    };

  debug({verbose});
  content.info.description =
    'Esta es la definición el API MyDot, la capa visible del backend del Servicio MyDot';
  content.info.title = Config.POSTMAN_NAME;
  content.basePath = '/api';
  content.host = Config.POSTMAN_API_HOST;
  content.consumes = ['application/json', 'application/x-www-form-urlencoded'];

  _.each(responsesUtils.extradefs, (defObj, defname) => {
    content.definitions[defname] = defObj;
  });

  content.produces = ['application/json'];
  //content.definitions = _.omit(content.definitions, ['x-any']);
  _.each(content.paths, function(properties, endpoint) {
    if (verbose) {
      debug(
        `${chalk.cyan(endpoint)} has ${chalk.green(
          _.size(properties)
        )} requests`,
        _.keys(properties).map(prop => prop.toUpperCase())
      );
    }
    let mainEntity = endpoint.split('/')[1];
    _.each(properties, function(propObject, propname) {
      let method = propname.toUpperCase();

      if (propObject.summary) {
        //        propObject.oldsummary = propObject.summary + '';
        propObject.summary = replaceSummary(
          propObject.summary,
          endpoint,
          verbose
        );
      }

      propObject.description = propObject.description || propObject.summary;

      propObject.responses['401'] = responsesUtils.AUTHORIZATION_REQUIRED;
      if (endpoint.indexOf('{id}') !== -1 || endpoint.indexOf('{fk}') !== -1) {
        propObject.responses['404'] = responsesUtils.MODEL_NOT_FOUND;
        //propObject.responses['403'] = responsesUtils.ACCESS_DENIED;
      }
      //propObject.responses['400'] = responsesUtils.BAD_REQUEST;

      if (method === 'POST' && mainEntity !== 'Cliente') {
        propObject.responses['422'] = responsesUtils.ER_DUP_ENTRY;
      }
      if (endpoint.indexOf('/login') !== -1) {
        propObject.responses['401'] = responsesUtils.LOGIN_FAILED;

        propObject.responses['400'] = responsesUtils.LOGIN_BAD_REQUEST;
      }

      //propObject.responses['405'] = {        description: 'Parámetros inválidos'      };
    });
  });
  return content;
}

module.exports = enrichContent;
