#!/usr/bin/env node
function getPostmanConf(env) {
  let {
      POSTMAN_TO,
      POSTMAN_KEY,
      POSTMAN_TOKEN,
      POSTMAN_API_HOST,
      POSTMAN_UPLOAD,
      POSTMAN_UID_PREFIX
    } = env,
    POSTMAN_ENV = String(env.POSTMAN_ENV || env.NODE_ENV).toUpperCase(),
    {
      //  Also check if there are namespaced keys like 'DEVELOPMENT_POSTMAN_ENVIRONMENT_ID'
      POSTMAN_ENVIRONMENT_ID = env[`${POSTMAN_ENV}_POSTMAN_ENVIRONMENT_ID`],
      POSTMAN_ENVIRONMENT_NAME = env[`${POSTMAN_ENV}_POSTMAN_ENVIRONMENT_NAME`],
      POSTMAN_COLLECTION_NAME = env[`${POSTMAN_ENV}_POSTMAN_COLLECTION_NAME`],
      POSTMAN_COLLECTION_ID = env[`${POSTMAN_ENV}_POSTMAN_COLLECTION_ID`]
    } = env,
    {
      POSTMAN_ENVIRONMENT_UID = `${POSTMAN_UID_PREFIX}-${POSTMAN_ENVIRONMENT_ID}`,
      POSTMAN_COLLECTION_UID = `${POSTMAN_UID_PREFIX}-${POSTMAN_COLLECTION_ID}`
    } = env,
    expectedLength = {
      POSTMAN_ENVIRONMENT_UID: 44,
      POSTMAN_UID_PREFIX: 7,
      POSTMAN_ENVIRONMENT_ID: 36,
      POSTMAN_COLLECTION_ID: 36,
      POSTMAN_COLLECTION_UID: 44
    };

  POSTMAN_ENVIRONMENT_ID =
    POSTMAN_ENVIRONMENT_ID || (POSTMAN_ENVIRONMENT_UID || '').substr(8, 36);
  POSTMAN_COLLECTION_ID =
    POSTMAN_COLLECTION_ID || (POSTMAN_COLLECTION_UID || '').substr(8, 36);

  POSTMAN_UID_PREFIX =
    POSTMAN_UID_PREFIX ||
    (POSTMAN_ENVIRONMENT_UID || POSTMAN_COLLECTION_UID || '').substr(0, 7);

  const POSTMAN_CONF = {
    //    POSTMAN_UPLOAD,
    POSTMAN_TO,
    POSTMAN_KEY,
    POSTMAN_TOKEN,
    POSTMAN_API_HOST,

    POSTMAN_UID_PREFIX,
    POSTMAN_ENV,

    POSTMAN_ENVIRONMENT_NAME:
      POSTMAN_ENVIRONMENT_NAME || `ENVIRONMENT ${POSTMAN_ENVIRONMENT_ID}`,
    POSTMAN_ENVIRONMENT_ID,
    POSTMAN_ENVIRONMENT_UID,

    POSTMAN_COLLECTION_NAME:
      POSTMAN_COLLECTION_NAME || `COLLECTION ${POSTMAN_COLLECTION_ID}`,
    POSTMAN_COLLECTION_ID,
    POSTMAN_COLLECTION_UID
  };

  for (let configKey of Object.keys(expectedLength)) {
    if (POSTMAN_CONF[configKey].length !== expectedLength[configKey]) {
      throw new Error(
        `${configKey} must have exactly ${expectedLength[configKey]} characters `
      );
    }
  }
  Object.assign(POSTMAN_CONF, {
    POSTMAN_COLLECTION_NAME: [
      `${POSTMAN_CONF.POSTMAN_COLLECTION_NAME.replace(
        env.API_VERSION,
        ''
      ).trim()}`,
      `${env.API_VERSION}`
    ].join('')
  });
  //debug({POSTMAN_CONF});

  return POSTMAN_CONF;
}

function createConfig(options) {
  const path = require('path'),
    this_script = path.basename(__filename, path.extname(__filename)),
    debug = require('debug')(`pm_sync:${this_script}`);

  //Error.stackTraceLimit = 15;

  // debug = require('debug')(`${env.DEBUG_PREFIX}:${this_script}`);

  function textToInt(value) {
    //if (typeof value === 'string') {    return value !== 'false';  }
    return !isNaN(Number(value)) && Number(value) >= 1 ? 1 : 0;
  }

  let {
      API_PROTOCOL = 'https',
      NODE_ENV = process.env.NODE_ENV,
      API_HOST = 'localhost',
      API_VERSION = '0.0.1',
      PORT = 3000,
      START_TIME = Date.now()
    } = options,
    PMSYNC_FOLDER = path.resolve(`${__dirname}/..`),
    Config = {
      PMSYNC_FOLDER,
      LIB_FOLDER: path.resolve(`${PMSYNC_FOLDER}/lib`),
      UTILS_FOLDER: path.resolve(`${PMSYNC_FOLDER}/lib/utils`),

      API_HOST,

      PORT,
      START_TIME,
      API_PROTOCOL,
      API_VERSION,
      spentTime: () => {
        return Number((Date.now() - START_TIME) / 1000).toFixed(1) + 's ';
      }
    };

  // debug({Config});

  const POSTMAN_CONF = getPostmanConf({
    API_VERSION: Config.API_VERSION,
    ...options
  });
  Object.assign(Config, POSTMAN_CONF);

  return Config;
}

module.exports = createConfig;
