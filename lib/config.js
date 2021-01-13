#!/usr/bin/env node
const exampleConfig = require(`${__dirname}/../config.example.json`);
const path = require('path'),
  this_script = path.basename(__filename, path.extname(__filename)),
  debug = require('debug')(`pm_sync:${this_script}`);
const pickWhitelistedConfigKeys = (options) => {
  const configKeys = [
    'API_HOST',
    'API_VERSION',
    'API_PROTOCOL',
    'LIB_FOLDER',
    'OUTPUT_FOLDER',
    'PMSYNC_FOLDER',
    'PORT',
    'START_TIME',
    'UTILS_FOLDER',
    'injectCollectionScripts',
  ];

  return Object.fromEntries(
    Object.entries(options).filter(([key, value]) => {
      return configKeys.includes(key) || String(key).startsWith('POSTMAN');
    })
  );
};
function getPostmanConf(env) {
  let {
      POSTMAN_TO,
      POSTMAN_KEY,
      POSTMAN_TOKEN,
      POSTMAN_API_HOST,

      POSTMAN_UID_PREFIX,
    } = env,
    POSTMAN_ENV = String(env.POSTMAN_ENV || env.NODE_ENV).toUpperCase(),
    POSTMAN_CONF = {
      POSTMAN_TO,
      POSTMAN_KEY,
      POSTMAN_TOKEN,
      POSTMAN_API_HOST,
      POSTMAN_INJECT_SCRIPTS: !!env.POSTMAN_INJECT_SCRIPTS,
      POSTMAN_ENV,
      POSTMAN_UID_PREFIX,
    },
    configKeys = [
      'POSTMAN_ENVIRONMENT_ID',
      'POSTMAN_COLLECTION_ID',
      'POSTMAN_ENVIRONMENT_NAME',
      'POSTMAN_COLLECTION_NAME',
      'POSTMAN_ENVIRONMENT_UID',
      'POSTMAN_COLLECTION_UID',
    ];
  POSTMAN_CONF.POSTMAN_UID_PREFIX =
    env.POSTMAN_UID_PREFIX ||
    (env.POSTMAN_ENVIRONMENT_UID || env.POSTMAN_COLLECTION_UID || '').substr(
      0,
      7
    );
  configKeys.forEach((keyName) => {
    POSTMAN_CONF[keyName] = env[`${POSTMAN_ENV}_${keyName}`] || env[keyName];
    if (keyName.includes('_UID')) {
      // for POSTMAN_ENVIRONMENT_UID and POSTMAN_COLLECTION_UID check if we
      // have their respective _ID values and guess from them
      POSTMAN_CONF[keyName] =
        POSTMAN_CONF[keyName] ||
        `${POSTMAN_UID_PREFIX}-${POSTMAN_CONF[keyName.replace('_UID', '_ID')]}`;
    }
    if (keyName.includes('_NAME')) {
      // for POSTMAN_ENVIRONMENT_UID and POSTMAN_COLLECTION_UID check if we
      // have their respective _ID values and guess from them
      POSTMAN_CONF[keyName] =
        POSTMAN_CONF[keyName] ||
        `${POSTMAN_UID_PREFIX}-${
          POSTMAN_CONF[keyName.replace('_NAME', '_ID')]
        }`;
    }
  });

  expectedLength = {
    POSTMAN_ENVIRONMENT_UID: 44,
    POSTMAN_UID_PREFIX: 7,
    POSTMAN_ENVIRONMENT_ID: 36,
    POSTMAN_COLLECTION_ID: 36,
    POSTMAN_COLLECTION_UID: 44,
  };

  for (let configKey of Object.keys(expectedLength)) {
    if (POSTMAN_CONF[configKey].length !== expectedLength[configKey]) {
      throw new Error(
        `${configKey} must have exactly ${expectedLength[configKey]} characters. ${POSTMAN_CONF[configKey].length} found: ${POSTMAN_CONF[configKey]} `
      );
    }
  }

  Object.assign(POSTMAN_CONF, {
    POSTMAN_COLLECTION_NAME: [
      `${POSTMAN_CONF.POSTMAN_COLLECTION_NAME.replace(
        env.API_VERSION,
        ''
      ).trim()}`,
      `${env.API_VERSION}`,
    ].join(''),
  });
  return pickWhitelistedConfigKeys(POSTMAN_CONF);
}

function createConfig(options, calledFrom) {
  if (!options) {
    options = process.env;
  }
  // This means the config has already been normalized
  if (options.LIB_FOLDER && options.UTILS_FOLDER) {
    return options;
  }

  //Error.stackTraceLimit = 15;

  // debug = require('debug')(`${env.DEBUG_PREFIX}:${this_script}`);

  function textToInt(value) {
    //if (typeof value === 'string') {    return value !== 'false';  }
    return !isNaN(Number(value)) && Number(value) >= 1 ? 1 : 0;
  }
  const mkdirp = require('mkdirp');

  let {
      API_PROTOCOL = 'https',
      NODE_ENV = process.env.NODE_ENV,
      API_HOST = 'localhost',
      API_VERSION = '0.0.1',
      PORT = 3000,
      START_TIME = Date.now(),
      OUTPUT_FOLDER = path.resolve(`${__dirname}/../output`),
    } = options,
    PMSYNC_FOLDER = path.resolve(`${__dirname}/..`),
    Config = {
      API_HOST,
      API_PROTOCOL,
      API_VERSION,
      LIB_FOLDER: path.resolve(`${PMSYNC_FOLDER}/lib`),
      OUTPUT_FOLDER,
      PMSYNC_FOLDER,
      PORT,
      START_TIME,
      UTILS_FOLDER: path.resolve(`${PMSYNC_FOLDER}/lib/utils`),
      injectCollectionScripts: options.injectCollectionScripts,
      spentTime: () => {
        return Number((Date.now() - START_TIME) / 1000).toFixed(1) + 's ';
      },
    };

  let envOptions = pickWhitelistedConfigKeys(options);
  try {
    debug(
      `will try to create out folders under "${OUTPUT_FOLDER}" if they doen't exist`,
      Object.keys(envOptions)
    );
    //debug({...envOptions, calledFrom});
    mkdirp.sync(OUTPUT_FOLDER);
    mkdirp.sync(`${OUTPUT_FOLDER}/json_collections`);
    mkdirp.sync(`${OUTPUT_FOLDER}/json_collections/in_process`);
    mkdirp.sync(`${OUTPUT_FOLDER}/json_environments`);
    mkdirp.sync(`${OUTPUT_FOLDER}/specs`);
    mkdirp.sync(`${OUTPUT_FOLDER}/postman_testscripts`);
    mkdirp.sync(`${OUTPUT_FOLDER}/specs/swagger`);
    mkdirp.sync(`${OUTPUT_FOLDER}/specs/openapi`);
    mkdirp.sync(`${OUTPUT_FOLDER}/specs/json-schema`);
    mkdirp.sync(`${OUTPUT_FOLDER}/specs/postman`);
    // debug({Config});
  } catch (err) {
    console.error(err);
  }
  const POSTMAN_CONF = getPostmanConf({
    API_VERSION: Config.API_VERSION,
    ...envOptions,
  });

  if (
    POSTMAN_CONF.POSTMAN_INJECT_SCRIPTS &&
    typeof Config.injectCollectionScripts !== 'function'
  ) {
    console.warn(
      `Warning:
      POSTMAN configured to inject scripts, but no "injectCollectionScripts" function passed to Config object
      `
    );
  }
  Object.assign(Config, POSTMAN_CONF);
  return Config;
}

module.exports = createConfig;
module.exports.pickWhitelistedConfigKeys = pickWhitelistedConfigKeys;
