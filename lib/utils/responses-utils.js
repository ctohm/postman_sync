function responsesUtils(Config) {
  const _ = require('lodash'),
    path = require('path'),
    specPaths = require(`${Config.UTILS_FOLDER}/get_spec_paths.js`),
    this_script = path.basename(__filename, path.extname(__filename)),
    debug = require('debug')(`postman_synchronizer:${this_script}`),
    chalk = require('chalk');

  return {
    AUTHORIZATION_REQUIRED: {
      description: 'AUTHORIZATION_REQUIRED',
      schema: {
        $ref: '#/definitions/AUTHORIZATION_REQUIRED'
      },
      examples: {
        'application/json': {
          statusCode: 401,
          name: 'Error',
          message: 'Autorización necesaria',
          code: 'AUTHORIZATION_REQUIRED'
        }
      }
    },
    MODEL_NOT_FOUND: {
      description: 'MODEL_NOT_FOUND',
      schema: {
        $ref: '#/definitions/MODEL_NOT_FOUND'
      },
      examples: {
        'application/json': {
          statusCode: 404,
          name: 'Error',
          message: 'no se ha encontrado el modelo solicitado',
          code: 'MODEL_NOT_FOUND'
        }
      }
    },
    ACCESS_DENIED: {
      description: 'ACCESS_DENIED',
      schema: {
        $ref: '#/definitions/ACCESS_DENIED'
      },
      examples: {
        'application/json': {
          statusCode: 403,
          name: 'Error',
          message: 'Acceso denegado',
          code: 'ACCESS_DENIED'
        }
      }
    },
    BAD_REQUEST: {
      description: 'BAD_REQUEST',
      schema: {
        $ref: '#/definitions/BAD_REQUEST'
      },
      examples: {
        'application/json': {
          statusCode: 400,
          name: 'SyntaxError',
          message: 'Malformed JSON body',
          code: 'BAD_REQUEST'
        }
      }
    },
    ER_DUP_ENTRY: {
      description: 'ER_DUP_ENTRY',
      schema: {
        $ref: '#/definitions/ER_DUP_ENTRY'
      },
      examples: {
        'application/json': {
          statusCode: 422,
          name: 'Error',
          message: 'Se intentó insertar un registro duplicado',
          code: 'ER_DUP_ENTRY'
        }
      }
    },
    LOGIN_FAILED: {
      description: 'LOGIN_FAILED',
      schema: {
        $ref: '#/definitions/LOGIN_FAILED'
      },
      examples: {
        'application/json': {
          statusCode: 401,
          name: 'Error',
          message: 'El inicio de sesión ha fallado',
          code: 'LOGIN_FAILED'
        }
      }
    },
    LOGIN_BAD_REQUEST: {
      description: 'BAD_REQUEST',
      schema: {
        $ref: '#/definitions/BAD_REQUEST'
      },
      examples: {
        'application/json': {
          statusCode: 400,
          name: 'Error',
          message: 'username o email es obligatorio',
          code: 'USERNAME_EMAIL_REQUIRED'
        }
      }
    },
    extradefs: {
      AUTHORIZATION_REQUIRED: {
        description: 'Requiere Autorización (login)',
        properties: {
          error: {
            type: 'x-any'
          }
        },
        required: ['error']
      },

      ER_DUP_ENTRY: {
        description: 'Se ha intentado crear una entidad existente',
        properties: {
          error: {
            type: 'x-any'
          }
        },
        required: ['error']
      },

      ACCESS_DENIED: {
        description:
          'Se intentó acceder un modelo sobre el cual no se tiene permiso',
        properties: {
          error: {
            type: 'x-any'
          }
        },
        required: ['error']
      },

      LOGIN_FAILED: {
        description:
          'Se intentó acceder un modelo sobre el cual no se tiene permiso',
        properties: {
          error: {
            type: 'x-any'
          }
        },
        required: ['error']
      },

      BAD_REQUEST: {
        description: 'Petición tiene error de sintaxis',
        properties: {
          error: {
            type: 'x-any'
          }
        },
        required: ['error']
      },

      MODEL_NOT_FOUND: {
        description: 'No se ha encontrado instancia del modelo',
        properties: {
          error: {
            type: 'x-any'
          }
        },
        required: ['error']
      }
    }
  };
}
module.exports = responsesUtils;
