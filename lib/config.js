#!/usr/bin/env node

const path = require('path');
process.env.PROJECT_ROOT = path.resolve(`${__dirname}/..`);
process.env.LIB_FOLDER = path.resolve(`${process.env.PROJECT_ROOT}/lib`);
process.env.UTILS_FOLDER = path.resolve(`${process.env.LIB_FOLDER}/utils`);
process.env.CONFIG_PATH = path.resolve(`${process.env.LIB_FOLDER}/config.js`);
require('dotenv').config({
  path: path.resolve(`${process.env.PROJECT_ROOT}/.env`),
  silent: false
});
const pkgConfig = require(path.resolve(
    `${process.env.PROJECT_ROOT}/package.json`
  )),
  this_script = path.basename(__filename, path.extname(__filename)),
  debug = require('debug')(`${process.env.DEBUG_PREFIX}:${this_script}`);

//Error.stackTraceLimit = 15;

// debug = require('debug')(`${env.DEBUG_PREFIX}:${this_script}`);

function textToInt(value) {
  //if (typeof value === 'string') {    return value !== 'false';  }
  return !isNaN(Number(value)) && Number(value) >= 1 ? 1 : 0;
}
function getPostmanConf(Config, env) {
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
      `v${Config.API_VERSION}`
    ].join(' ')
  });
  //debug({POSTMAN_CONF});

  return POSTMAN_CONF;
}

function createConfig(env) {
  const API_HOST = env.API_HOST || 'cesion.local.fff',
    START_TIME = env.START_TIME || Date.now(),
    chalk = require('chalk');
  let {PROJECT_ROOT, LIB_FOLDER, UTILS_FOLDER, CONFIG_PATH} = env;
  const Config = {
    ROLLBAR_TOKEN: env.ROLLBAR_TOKEN,

    START_TIME,
    spentTime: () => {
      return Number((Date.now() - START_TIME) / 1000).toFixed(1) + 's ';
    },

    API_VERSION: pkgConfig.version,
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
    ROOT_PATH: process.env.PROJECT_ROOT,
    RUNNING_ON: env.RUNNING_ON
  };
  // debug({Config});

  const POSTMAN_CONF = getPostmanConf(Config, env);
  Object.assign(Config, POSTMAN_CONF);

  return {...Config, PROJECT_ROOT, LIB_FOLDER, UTILS_FOLDER, CONFIG_PATH};
}
module.exports = createConfig(process.env);

setTimeout(() => {
  console.log('will exit');
  process.exit(0);
}, 3000);
