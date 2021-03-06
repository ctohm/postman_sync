#!/usr/bin/env node

const {snakeCase} = require('lodash');

module.exports = function (Config) {
  const initialFolder = `${Config.OUTPUT_FOLDER}/postman_testscripts`;

  const Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),
    path = require('path'),
    _ = require('lodash'),
    chalk = require('chalk'),
    specPaths = require(`${Config.UTILS_FOLDER}/get_spec_paths.js`)(Config),
    this_script = path.basename(__filename, path.extname(__filename)),
    separatorCommentStart = `/* eslint-disable no-unused-expressions,no-extend-native */`,
    separatorCommentEnd = `/* eslint-disable @typescript-eslint/ban-ts-comment */`,
    debug = require('debug')(`pm_sync:${this_script}`),
    mkdirp = require('mkdirp');

  function skipEmptyElementsUntilOneNonEmpty(arr) {
    return arr.reduce((accum, item) => {
      if (String(item).length || accum.length) {
        accum.push(item);
      }
      return accum;
    }, []);
  }
  function writeCleanEvent({cleanName, fileName, cleanEvent, exec}) {
    let functionName = _.camelCase(
        cleanEvent.name.split('.').reverse().join('_')
      ),
      execArray = skipEmptyElementsUntilOneNonEmpty(exec);

    execArray = skipEmptyElementsUntilOneNonEmpty(
      execArray.reverse()
    ).reverse();

    fs.writeFileSync(
      fileName,

      [
        `/// <reference types="newman" />`,
        `// @ts-check`,
        `// ${cleanEvent.name}`,
        `// ${cleanEvent.id}`,
        ``,
        `const _ = require('lodash'),`,
        `  { Collection, VariableScope } = require('postman-collection'),`,
        `  tv4 = require('tv4');`,
        ``,
        `/**`,
        `* @param {import('newman').NewmanRunOptions & {variables:VariableScope,collectionVariables:VariableScope}} pm `,
        `*/`,
        ` function ${functionName}(pm ) {`,
        separatorCommentStart,
      ]
        .concat(execArray)
        .concat([separatorCommentEnd, `}`, `module.exports = ${functionName};`])
        .join('\n')
    );
    return cleanEvent;
  }

  function mapCountedEvents(name, events, suffix, saveFolder = initialFolder) {
    events = events
      .map((event) => {
        let {listen, script: {id, type, exec} = {}} = event;
        return {
          listen,
          name: `${name}.${listen}`,
          id,
          execLines: exec.length,
          exec,
        };
      })
      .filter((event) => event.execLines);
    //debug({name, eventslength: events.length});
    mkdirp.sync(`${saveFolder}`);
    return events.map((event) => {
      let {exec, listen, ...cleanEvent} = event,
        cleanName = _.snakeCase(cleanEvent.name.split('/').pop());

      let fileName = `${saveFolder}/${cleanName}.js`.replace(
          `_${listen}.js`,
          `.${listen}.js`
        ),
        dirname = `${saveFolder}`;

      writeCleanEvent({cleanName, fileName, cleanEvent, exec});
      return {fileName, id: cleanEvent.id};
    });
  }
  function countEvents(
    itemGroup,
    accum = [],
    parent = '',
    breadCrumb = [],
    saveFolder = initialFolder
  ) {
    let {item: items, event: events, name = 'root'} = itemGroup || {},
      shouldRecurse = items instanceof Array && items.length,
      chalkFN = chalk.cyan;

    if (parent === 'root') {
      chalkFN = chalk.bold.yellow;
      breadCrumb = [name.charAt(0)];
    }
    name = name.replace(/^[\d_.\s]*/, '');
    let suffixTxt = breadCrumb.join('_');

    name = `${suffixTxt}_${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    if (events && events.length) {
      accum = accum.concat(
        mapCountedEvents(name, events, breadCrumb, saveFolder)
      );
    }

    if (shouldRecurse) {
      accum = accum.concat(
        items.reduce((accum2, subGroup, index) => {
          let newSuffix =
              name === 'root'
                ? [String(index)]
                : breadCrumb.concat(
                    String(index).padStart(breadCrumb.length, '0')
                  ),
            newTopLevelFolder = `${newSuffix.join('_')}_${_.snakeCase(
              subGroup.name.replace(/^[\d_.\s]*/, '')
            )}`;

          let newSaveFolder = `${saveFolder}/${newTopLevelFolder}`;
          //debug(            `${chalk.bold.white(              saveFolder.replace(initialFolder, '')            )} / ${chalk.bold.cyan(newTopLevelFolder)}   `          );
          mkdirp.sync(newSaveFolder);

          accum2 = accum2.concat(
            countEvents(subGroup, accum, name, newSuffix, newSaveFolder)
          );
          return accum2;
        }, [])
      );
    }
    return accum;
  }

  function mapEvents(
    name,
    events = [],
    parent = '',
    saveFolder = initialFolder
  ) {
    events = events
      .map((event) => {
        let {listen, script: {id, type, exec} = {}} = event;
        return {
          listen,
          name: `${name}.${listen}`,
          id,
          execLines: exec.length,
          exec,
        };
      })
      .filter((event) => event.execLines);
    if (!events.length) {
      return [];
    }
    saveFolder = path.dirname(saveFolder);
    debug(
      `${chalk.bold.white(parent)} / ${chalk.bold.cyan(snakeCase(name))}   ${
        events && events.length
      } events`
    );
    mkdirp.sync(`${saveFolder}`);

    return events.map((event) => {
      let {exec, listen, ...cleanEvent} = event,
        cleanName = _.snakeCase(cleanEvent.name.split('/').pop());

      let fileName = `${saveFolder}/${cleanName}.js`.replace(
          `_${listen}.js`,
          `.${listen}.js`
        ),
        dirname = `${saveFolder}`;

      return writeCleanEvent(fileName, cleanEvent, exec);
    });
  }

  function processEvents(
    itemGroup,
    {accum = [], parent = '', breadCrumb = [], saveFolder = initialFolder}
  ) {
    let {item: items = [], event: events, name = 'root'} = itemGroup || {},
      shouldRecurse = items instanceof Array && items.length;

    if (events && events.length) {
      let eventScripts = mapEvents(name, events, parent, saveFolder);
      if (eventScripts.length) {
        accum = accum.concat(eventScripts);
      }
    }
    if (shouldRecurse) {
      accum = accum.concat(
        items.reduce((accum2, subGroup, index) => {
          let nextBreadCrumb = breadCrumb.concat(
            String(index).padStart(breadCrumb.length + 1, '0')
          );

          let cleanSubgroupName = subGroup.name.replace(/^[\d_.\s]*/, ''),
            newSubFolder = nextBreadCrumb.concat(
              _.snakeCase(cleanSubgroupName)
            ),
            newSaveFolder = `${saveFolder}/${newSubFolder.join('_')}`;
          if (parent === 'root') {
            console.log();
            console.log(chalk.bold.yellow(newSubFolder.join('_')));
          }
          //debug(newSubFolder);
          accum2 = accum2.concat(
            processEvents(subGroup, {
              accum,
              parent: name,
              breadCrumb: nextBreadCrumb,
              saveFolder: newSaveFolder,
            })
          );
          return accum2;
        }, [])
      );
    }

    return accum;
  }
  return {processEvents, countEvents};
};
