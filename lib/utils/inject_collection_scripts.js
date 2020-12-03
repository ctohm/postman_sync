#!/usr/bin/env node

const {Collection, EventList} = require('postman-collection');

/**
 *
 * @param {Record<string,string>} Config
 * @param {Collection} collection
 */
async function injectCollectionScripts(Config, collection) {
  const Promise = require('bluebird'),
    _ = require('lodash'),
    fs = Promise.promisifyAll(require('fs')),
    path = require('path'),
    this_script = path.basename(__filename, path.extname(__filename)),
    debug = require('debug')(`pm_sync:${this_script}`),
    chalk = require('chalk'),
    separatorCommentStart = `/* eslint-disable no-unused-expressions,no-extend-native */`,
    separatorCommentEnd = `/* eslint-disable @typescript-eslint/ban-ts-comment */`,
    scripts_folder = `${Config.OUTPUT_FOLDER}/postman_testscripts`;

  let primaryFolders = _.reduce(
    collection.item,
    (accum, item) => {
      let {name} = item,
        foldername = _.snakeCase(name.toLowerCase());

      let scripts = {
        folder: `${scripts_folder}`,
        test: `${scripts_folder}/${foldername}/${foldername}.test.js`,
        prerequest: `${scripts_folder}/${foldername}/${foldername}.prerequest.js`,
      };
      item.scripts = scripts;
      debug({name: item.name, foldername, scripts});
      accum[foldername] = item;
      return accum;
    },
    {}
  );

  const preScript = fs.readFileSync(
      `${scripts_folder}/root.prerequest.js`,
      'utf8'
    ),
    testScript = fs.readFileSync(`${scripts_folder}/root.test.js`, 'utf8');
  //debug({clientePreScriptFile, botonPreScriptFile});

  let preScriptExec = preScript
    .replace(startRgx, separatorCommentStart)
    .split(separatorCommentStart)
    .pop()
    .split(separatorCommentEnd)
    .shift()
    .split('\n');

  let prereqScript = collection.event.find((event) => {
    return event.listen === 'prerequest';
  });

  prereqScript.script.exec = preScriptExec;

  /**
   * @type {EventList}
   */
  let events = collection.events;

  debug({events});
  collection.event.find((event) => {
    return event.listen === 'test';
  }).script.exec = testScript
    .split(separatorCommentStart)
    .pop()
    .split(separatorCommentEnd)
    .shift()
    .split('\n');
  return collection;
}
module.exports = injectCollectionScripts;
