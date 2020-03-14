#!/usr/bin/env node
function getCollectionScripts(Config, collection) {
  const Promise = require('bluebird'),
    _ = require('lodash'),
    fs = Promise.promisifyAll(require('fs')),
    path = require('path'),
    specPaths = require(`${Config.UTILS_FOLDER}/get_spec_paths.js`)(Config),
    this_script = path.basename(__filename, path.extname(__filename)),
    debug = require('debug')(`postman_synchronizer:${this_script}`),
    chalk = require('chalk');

  let clienteItem = collection.item.find(item => {
    return item.name === '1_Cliente';
  });
  //debug({events: clienteItem.event || clienteItem.events});
  const clientePrescript = fs.readFileSync(
      `${process.env.PMSYNC_FOLDER}/postman_testscripts/01_cliente/01_cliente_prerequest.js`,
      'utf8'
    ),
    preScript = fs.readFileSync(
      `${process.env.PMSYNC_FOLDER}/postman_testscripts/root_prerequest.js`,
      'utf8'
    ),
    testScript = fs.readFileSync(
      `${process.env.PMSYNC_FOLDER}/postman_testscripts/root_test.js`,
      'utf8'
    );

  /**
   * This part will replace the event or events section in
   */
  (clienteItem.event || clienteItem.events).find(event => {
    return event.listen === 'prerequest';
  }).script.exec = clientePrescript
    .split('/* eslint-disable no-unused-expressions,no-extend-native */')
    .pop()
    .split('\n');

  collection.event.find(event => {
    return event.listen === 'prerequest';
  }).script.exec = preScript
    .split('/* eslint-disable no-unused-expressions,no-extend-native */')[1]
    .split('\n');
  collection.event.find(event => {
    return event.listen === 'test';
  }).script.exec = testScript
    .split('/* eslint-disable no-unused-expressions,no-extend-native */')[1]
    .split('\n');
  return collection;
}
module.exports = getCollectionScripts;
