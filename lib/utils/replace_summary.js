const path = require('path'),
  specPaths = require(`${process.env.UTILS_FOLDER}/get_spec_paths.js`),
  Config = require(`${process.env.LIB_FOLDER}/config.js`),
  this_script = path.basename(__filename, path.extname(__filename)),
  debug = require('debug')(`${Config.DEBUG_PREFIX}:docs:${this_script}`),
  chalk = require('chalk'),
  entityUtils = require(`${process.env.UTILS_FOLDER}/entity-utils.js`);

function clienteReplacements(replaced, entity) {
  return replaced
    .replace(
      'Login a user with username/email and password',
      `${entity} Inicia sesión usando email y password`
    )
    .replace(
      'Logout a user with access token',
      `${entity} Cierra sesión. Requiere AccessToken`
    )
    .replace(
      "Reset user's password via a password-reset token",
      `${entity} Restablece password de un usuario mediante correoy link único`
    )
    .replace(
      "Trigger user's identity verification with configured verifyOptions",
      'Gatilla la verificación de la cuenta de usuario'
    )
    .replace("Change a user's password", 'Cambia el password de un usuario')
    .replace(
      'Confirm a user registration with identity verification token',
      `${entity} Confirma registro siguiendo un link`
    );
}

function replaceSummary(summary, endpoint, verbose) {
  let original = '' + summary;

  var endpointArr = endpoint.split('/'),
    entity = endpointArr[1],
    dependent = endpointArr[3];

  if (dependent === 'rel') {
    dependent = endpointArr[4];
  }

  //debug({endpoint, entity, dependent});

  let replaced = summary
    .replace(
      'botones consultas de ProductoCategoria',
      `Lista Productos de tipo Botón de ${entityUtils.getEntityWithArticle(
        entity
      )}`
    )
    .replace(
      'consumibles consultas de ProductoCategoria',
      `Lista Productos de tipo consumible de ${entityUtils.getEntityWithArticle(
        entity
      )}`
    )
    .replace('botones consultas de Producto', `Lista Productos de tipo Botón`)
    .replace(
      'consumibles consultas de Producto',
      `Lista Productos de tipo consumible`
    )

    .replace(
      'Create a new instance of the model and persist it into the data source',
      `Crea ${entityUtils.getEntityWithArticle(entity)} y persiste en BBDD`
    )
    .replace(
      'Patch attributes for a model instance and persist it into the data source',
      `Modifica o crea ${entityUtils.getEntityWithArticle(
        entity
      )} y persiste en BBDD`
    )
    .replace(
      'Patch an existing model instance or insert a new one into the data source',
      `Modifica o crea ${entityUtils.getEntityWithArticle(
        entity
      )} y persiste en BBDD`
    )
    .replace(
      'Check whether a model instance exists in the data source',
      `Verifica si ${entityUtils.getEntityWithArticle(
        entity
      )} existe en la BBDD`
    )
    .replace(
      'Replace attributes for a model instance and persist it into the data source',
      `Modifica ${entityUtils.getEntityWithArticle(entity)} y persiste en BBDD`
    )
    .replace(
      'Find all instances of the model matched by filter from the data source',
      `Lista completa de ${entityUtils.getPlural(entity)} (filtro opcional)`
    )
    .replace(
      'Count instances of the model matched by where en la BBDD',
      `Cuenta ${entityUtils.getPlural(entity)} (filtro opcional)`
    )
    .replace(
      'Count instances of the model matched by where',
      `Cuenta ${entityUtils.getPlural(entity)} (filtro opcional)`
    );

  if (entity === 'Cliente') {
    replaced = clienteReplacements(replaced, entity);
  }

  if (dependent) {
    replaced = replaced.replace(
      `Crea una nueva instancia en ${dependent}`,
      'Agrega ' + entityUtils.getEntityWithArticle(dependent)
    );
  }

  if (
    replaced.indexOf('Capta la relación belongsTo') !== -1 ||
    replaced.indexOf('Capta la relación hasOne') !== -1
  ) {
    replaced = replaced.replace(
      /Capta la relación belongsTo (\w+)/,
      `Muestra |$1| ${entityUtils.getEntityWithArticle(entity)}`
    );
    replaced = replaced.replace(
      /Capta la relación hasOne (\w+)/,
      `Muestra |$1| ${entityUtils.getEntityWithArticle(entity)}`
    );
    replaced = entityUtils.replaceBelongsTo(replaced);
  }

  replaced = replaced
    .replace(
      'Delete a model instance by',
      `Eliminar ${entityUtils.getEntityWithArticle(entity)} por`
    )
    .replace('de este modelo', `a ${entityUtils.getEntityWithArticle(entity)}`)
    .replace(
      'Find a model instance by',
      `Encuentra ${entityUtils.getEntityWithArticle(entity)} por`
    )
    .replace('from the data source', 'en la BBDD')
    .replace(
      /(\w+)\sconsultas de (\w+)/,
      `Lista |$1| de ` + entityUtils.getEntityWithArticle(entity)
    )

    .replace(
      /un elemento relacionado por id para (\w+)/,
      '|$1| de ' + entityUtils.getEntityWithArticle(entity)
    )
    .replace(
      /Recuentos (\w+) de (\w+)/,
      `Cuenta $1 pertenecientes a ` + entityUtils.getEntityWithArticle(entity)
    );

  replaced = entityUtils.relationToModelname(
    replaced

      .replace(
        /Eliminar (\w+) de un elemento por id/,
        'Elimina |$1| de ' + entityUtils.getEntityWithArticle(entity)
      )
      .replace(
        /Eliminar la relación (\w+) con un elemento por id/,
        'Elimina |$1| de ' + entityUtils.getEntityWithArticle(entity)
      )
      .replace(
        /Añadir (\w+) de un elemento por id/,
        'Agrega |$1| a ' + entityUtils.getEntityWithArticle(entity)
      )
    //,true
  );

  replaced = replaced
    .replace('una entidad Encuentra', 'Encuentra')
    .replace('una entidad Lista', 'Lista')
    .replace('/Botons/g', 'Botones')
    .replace(
      /Lista (pedidos|botones)+ de una Ventana Horaria/i,
      'Lista $1 (propios) dentro de una Ventana Horaria'
    )
    .replace(
      /Lista completa de (pedidos|botones)+/i,
      'Lista completa de $1 (propios)'
    );

  if (verbose) {
    debug(`${chalk.bold.blue('#######')} ${chalk.bold.cyan(
      endpoint
    )} summary: ${chalk.bold.blue('#######')}
    from: ${chalk.yellow(original)}
      to: ${chalk.bold.green(replaced)} `);
  }

  //replaced = entityUtils.getEntityWithArticle(replaced);
  return replaced;
}
module.exports = replaceSummary;
