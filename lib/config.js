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
    POSTMAN_ENVIRONMENT_ID = env[`${POSTMAN_ENV}_POSTMAN_ENVIRONMENT_ID`],
    POSTMAN_ENVIRONMENT_NAME = env[`${POSTMAN_ENV}_POSTMAN_ENVIRONMENT_NAME`],
    POSTMAN_ENVIRONMENT_UID = `${POSTMAN_UID_PREFIX}-${POSTMAN_ENVIRONMENT_ID}`,
    POSTMAN_COLLECTION_NAME = env[`${POSTMAN_ENV}_POSTMAN_COLLECTION_NAME`],
    POSTMAN_COLLECTION_ID = env[`${POSTMAN_ENV}_POSTMAN_COLLECTION_ID`],
    POSTMAN_COLLECTION_UID = `${POSTMAN_UID_PREFIX}-${POSTMAN_COLLECTION_ID}`,
    POSTMAN_CONF = {
      POSTMAN_UPLOAD,
      POSTMAN_TO,
      POSTMAN_KEY,
      POSTMAN_TOKEN,
      POSTMAN_API_HOST,
      POSTMAN_ENV,
      POSTMAN_UID_PREFIX,
      POSTMAN_COLLECTION_NAME,
      POSTMAN_COLLECTION_ID,
      POSTMAN_COLLECTION_UID,
      POSTMAN_ENVIRONMENT_NAME,
      POSTMAN_ENVIRONMENT_ID,
      POSTMAN_ENVIRONMENT_UID
    };

  Object.assign(POSTMAN_CONF, {
    POSTMAN_COLLECTION_NAME: [
      `${POSTMAN_CONF.POSTMAN_COLLECTION_NAME}`,
      `v${env.API_VERSION}`
    ].join(' ')
  });
  //debug({POSTMAN_CONF});

  return POSTMAN_CONF;
}

function createConfig(env, VERSION = '0.0.1') {
  const path = require('path'),
    this_script = path.basename(__filename, path.extname(__filename)),
    debug = require('debug')(`pm_sync:${this_script}`);

  //Error.stackTraceLimit = 15;

  // debug = require('debug')(`${env.DEBUG_PREFIX}:${this_script}`);

  function textToInt(value) {
    //if (typeof value === 'string') {    return value !== 'false';  }
    return !isNaN(Number(value)) && Number(value) >= 1 ? 1 : 0;
  }

  let Config = {
    PMSYNC_FOLDER:
      env.PMSYNC_FOLDER ||
      process.env.PMSYNC_FOLDER ||
      path.resolve(`${__dirname}/..`)
  };
  Config.LIB_FOLDER =
    env.LIB_FOLDER || path.resolve(`${Config.PMSYNC_FOLDER}/lib`);
  Config = {
    ...Config,
    UTILS_FOLDER: env.UTILS_FOLDER || path.resolve(`${Config.LIB_FOLDER}/utils`)
  };

  const API_HOST = env.API_HOST || 'cesion.local.fff',
    START_TIME = env.START_TIME || Date.now(),
    chalk = require('chalk');
  Config = {
    ...Config,
    ROLLBAR_TOKEN: env.ROLLBAR_TOKEN,

    START_TIME,
    spentTime: () => {
      return Number((Date.now() - START_TIME) / 1000).toFixed(1) + 's ';
    },

    API_VERSION: VERSION,
    INCLUDE_EXPLORER: env.INCLUDE_EXPLORER,
    MUTE_NOTIFICATIONS: env.MUTE_NOTIFICATIONS,
    LOGS_FOLDER: env.LOGS_FOLDER || '.logs',

    DEBUG_PREFIX: env.DEBUG_PREFIX,
    HOST: env.HOST,

    DEBUG: env.DEBUG,
    PORT: env.PORT || 2998,
    NODE_ENV: env.NODE_ENV,
    API_HOST,
    API_PROTOCOL: 'https',
    ROOT_PATH: process.env.PMSYNC_FOLDER,
    RUNNING_ON: env.RUNNING_ON
  };
  // debug({Config});

  const POSTMAN_CONF = getPostmanConf({
    API_VERSION: Config.API_VERSION,
    ...env
  });
  Object.assign(Config, POSTMAN_CONF);

  return Config;
}

module.exports = createConfig;
