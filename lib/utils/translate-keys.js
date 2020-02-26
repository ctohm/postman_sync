const _ = require('lodash'),
  path = require('path'),
  specPaths = require(`${process.env.UTILS_FOLDER}/get_spec_paths.js`),
  Config = require(`${process.env.LIB_FOLDER}/config.js`),
  this_script = path.basename(__filename, path.extname(__filename)),
  debug = require('debug')(`${Config.DEBUG_PREFIX}:docs:${this_script}`),
  chalk = require('chalk');

let keys = [
    {key: 'accessToken', to_key: 'accessToken'},
    {key: 'authorizationToken', to_key: 'authorizationToken'},
    {key: 'bearerToken', to_key: 'bearerToken'},
    {key: 'botones', to_key: 'botones'},
    {key: 'cantidadProductos', to_key: 'cantidadProductos'},
    {key: 'categorias', to_key: 'categorias'},
    {key: 'clientesEjemplo', to_key: 'clientesEjemplo'},
    {key: 'clientesObject', to_key: 'clientesObject'},
    {key: 'currentUser', to_key: 'currentUser'},
    {key: 'currentUserMail', to_key: 'currentUserMail'},
    {key: 'currentUsermail', to_key: 'currentUsermail'},
    {key: 'definition.Boton', to_key: 'definition.Boton'},
    {key: 'definition.Cliente', to_key: 'definition.Cliente'},
    {key: 'definition.Direccion', to_key: 'definition.Direccion'},
    {key: 'definition.Marca', to_key: 'definition.Marca'},
    {key: 'definition.MedioPago', to_key: 'definition.MedioPago'},
    {
      key: 'definition.NotificationToken',
      to_key: 'definition.NotificationToken'
    },
    {key: 'definition.Pedido', to_key: 'definition.Pedido'},
    {key: 'definition.Producto', to_key: 'definition.Producto'},
    {key: 'direcciones', to_key: 'direcciones'},
    {key: 'direccionesBorrables', to_key: 'direccionesBorrables'},
    {key: 'direccionesNoBorrables', to_key: 'direccionesNoBorrables'},
    {key: 'emailCliente1', to_key: 'emailCliente1'},
    {key: 'emailCliente8', to_key: 'emailCliente8'},
    {key: 'facebookToken', to_key: 'facebookToken'},
    {key: 'FCM_SENDER_ID', to_key: 'FCM_SENDER_ID'},
    {key: 'FCM_SERVER_KEY', to_key: 'FCM_SERVER_KEY'},
    {key: 'filter', to_key: 'filter'},
    {key: 'FIREBASE_API_KEY', to_key: 'FIREBASE_API_KEY'},
    {key: 'idBoton', to_key: 'idBoton'},
    {key: 'idBotonDisponible', to_key: 'idBotonDisponible'},
    {key: 'idCategoria', to_key: 'idCategoria'},
    {key: 'idCliente', to_key: 'idCliente'},
    {key: 'idDireccion', to_key: 'idDireccion'},
    {key: 'idDireccionEliminar', to_key: 'idDireccionEliminar'},
    {key: 'idDireccionPorDefecto', to_key: 'idDireccionPorDefecto'},
    {key: 'idMarca', to_key: 'idMarca'},
    {key: 'idMediopago', to_key: 'idMediopago'},
    {key: 'idMediopagoDefault', to_key: 'idMediopagoDefault'},
    {key: 'idMediopagoEliminar', to_key: 'idMediopagoEliminar'},
    {key: 'idPedido', to_key: 'idPedido'},
    {key: 'idPedidoFinalizado', to_key: 'idPedidoFinalizado'},
    {
      key: 'idPedidoVigenteFechaAnterior',
      to_key: 'idPedidoVigenteFechaAnterior'
    },
    {key: 'idProducto', to_key: 'idProducto'},
    {key: 'idProducto2', to_key: 'idProducto2'},
    {key: 'idProductoTipoBoton', to_key: 'idProductoTipoBoton'},
    {key: 'idTransaccion', to_key: 'idTransaccion'},
    {key: 'idVentana', to_key: 'idVentana'},
    {key: 'idVentanasHorario', to_key: 'idVentanasHorario'},
    {key: 'IID_TOKEN', to_key: 'IID_TOKEN'},
    {key: 'lastTestRun', to_key: 'lastTestRun'},
    {key: 'mainProduct70F11C0876FA', to_key: 'mainProduct70F11C0876FA'},
    {key: 'mainProduct70F11C087765', to_key: 'mainProduct70F11C087765'},
    {key: 'mediosPagoActivos', to_key: 'mediosPagoActivos'},
    {key: 'mediosPagoInActivos', to_key: 'mediosPagoInActivos'},
    {key: 'notificationPlatform', to_key: 'notificationPlatform'},
    {key: 'notificationToken', to_key: 'notificationToken'},
    {key: 'passwordCliente1', to_key: 'passwordCliente1'},
    {key: 'passwordCliente8', to_key: 'passwordCliente8'},
    {key: 'productoBoton', to_key: 'productoBoton'},
    {key: 'productosAgregables', to_key: 'productosAgregables'},
    {key: 'productosBoton70F11C0876FA', to_key: 'productosBoton70F11C0876FA'},
    {key: 'productosBoton70F11C087765', to_key: 'productosBoton70F11C087765'},
    {key: 'productosBotonMD0100000001', to_key: 'productosBotonMD0100000001'},
    {key: 'ProductoTipoBoton', to_key: 'ProductoTipoBoton'},
    {key: 'redirect', to_key: 'redirect'},
    {key: 'resetLink', to_key: 'resetLink'},
    {key: 'slack_channel_ffigueroa', to_key: 'slack_channel_ffigueroa'},
    {key: 'slack_channel_notifications', to_key: 'slack_channel_notifications'},
    {key: 'TBK_TOKEN', to_key: 'TBK_TOKEN'},
    {key: 'testStarted', to_key: 'testStarted'},
    {key: 'tokenCliente', to_key: 'tokenCliente'},
    {key: 'transaccionFilter', to_key: 'transaccionFilter'},
    {key: 'urlWebpay', to_key: 'urlWebpay'},
    {key: 'verificationToken', to_key: 'verificationToken'},
    {key: 'where', to_key: 'where'},
    {key: 'wrongidBoton', to_key: 'wrongidBoton'}
  ],
  plurales = {
    botones: 'boton',
    direcciones: 'direccion',
    mediospago: 'mediopago',
    pedidos: 'pedido',
    productos: 'producto'
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
    ventana: 'ventana'
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
    .filter(key => {
      return !key.to_key.includes('.');
    })
    .map(key => key.to_key)
);
console.log(
  _.sortBy(
    keys.filter(
      key => {
        return key.to_key.includes('.');
      },
      item => item.to_key
    )
  ).map(item => {
    return `.replace(/${item.key}/g,"${item.to_key.replace('.', '_')}")`;
  })
);
