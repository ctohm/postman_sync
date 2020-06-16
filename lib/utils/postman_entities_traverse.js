#!/usr/bin/env node

// normalize the configuration object
const Promise = require('bluebird'),
  fs = Promise.promisifyAll(require('fs')),
  path = require('path'),
  _ = require('lodash'),
  chalk = require('chalk'),
  this_script = path.basename(__filename, path.extname(__filename)),
  //debug = require('debug')(`pm_sync:${this_script}`),
  debug = require('debug')(`pm_sync:${this_script}`),
  mkdirp = require('mkdirp');

function trimResponses(itemGroup, level = 0) {
  level++;
  itemGroup.item = itemGroup.item || itemGroup.items;
  let {item: items, request, response: responses, ...otherKeys} = itemGroup;
  // debug({items, responses});
  if (itemGroup._ && itemGroup._.postman_isSubFolder) {
    //debug('postman_isSubFolder', itemGroup);
    itemGroup.item = itemGroup.item.map(item => {
      return trimResponses(item, level);
    });
  } else if (itemGroup.code) {
    //debug('HAS CODE', itemGroup);
  } else if (itemGroup instanceof Array) {
    //debug('itemGroup is Array', itemGroup);

    itemGroup = itemGroup.map(item => {
      return trimResponses(item, level);
    });
  } else if (itemGroup.item instanceof Array) {
    //debug('itemGroup.item is Array', itemGroup);
    itemGroup.item = itemGroup.item.map(item => {
      let trimmed = trimResponses(item, level);
      //debug(trimmed);
      return trimmed;
    });

    //debug(itemGroup);
  } else if (items && (items.response || items.request)) {
    responses = (items.response || []).filter(response => {
      let code = response.code;
      //debug(code);
      return ![401, 403, 404].includes(code);
    });

    itemGroup.item.response = responses;
  } else if (responses || request) {
    responses = (responses || {}).filter(response => {
      let code = response.code;
      //debug(code);
      return ![401, 403, 404].includes(code);
    });

    itemGroup.response = responses;
  } else {
    /* else if (items.item instanceof Array) {
    itemGroup.item = itemGroup.item.concat(
      items.item.map(item => {
        let trimmed = trimResponses(item);
        //debug(trimmed);
        return trimmed;
      })
    );*/
    debug(itemGroup);
  }
  return itemGroup;
}

function countRequests(itemGroup, accum = [], trim = false) {
  let items = itemGroup.items || itemGroup.item || {},
    responses = itemGroup.response || items.response,
    subitem = items.item || items.items;
  if (responses) {
    //debug(response);
    let codes = (trim
      ? responses.filter(response => {
          return ![401, 403, 404].includes(response.code);
        })
      : responses
    ).map(response => response.code);
    accum = accum.concat(codes);
  } else if (items instanceof Array) {
    accum = accum.concat(
      items.reduce((accum2, subGroup) => {
        accum2 = accum2.concat(countRequests(subGroup, accum, trim));
        return accum2;
      }, [])
    );
  }
  return accum;
}
function countEvents(
  itemGroup,
  accum = [],
  parent = '',
  suffix = [],
  separatorComment = `/* eslint-disable no-unused-expressions,no-extend-native */`,

  saveFolder
) {
  let {item: items, event: events, name = 'root'} = itemGroup || {},
    shouldRecurse = items instanceof Array && items.length,
    chalkFN = chalk.cyan;

  if (parent === 'root') {
    chalkFN = chalk.bold.yellow;
    suffix = [name.charAt(0)];
  }
  name = name.replace(/^[\d_.\s]*/, '');
  name = name.charAt(0).toUpperCase() + name.slice(1);
  let suffixTxt = suffix.join('_');

  name = `${suffixTxt}_${name}`;
  if (events && events.length) {
    events = events
      .map(event => {
        let {listen, script: {id, type, exec} = {}} = event;
        return {
          listen,
          name: `${name}.${listen}`,
          id,
          execLines: exec.length,
          exec
        };
      })
      .filter(event => event.execLines);
    mkdirp.sync(`${saveFolder}`);

    accum = accum.concat(
      events.map(event => {
        let {exec, listen, ...cleanEvent} = event,
          cleanName = _.snakeCase(cleanEvent.name.split('/').pop());

        let fileName = `${saveFolder}/${cleanName}.js`.replace(
            `_${listen}.js`,
            `.${listen}.js`
          ),
          dirname = `${saveFolder}`;
        if (!['8', '9'].includes(suffix[0]) && suffix.length === 2) {
          debug({
            cleanName,
            listen,
            saveFolder: saveFolder.replace(dirname, ''),
            // fileName: fileName.replace(dirname, ''),
            name
          });
        }
        fs.writeFileSync(
          fileName,
          [
            `// ${cleanEvent.name}`,
            `// ${cleanEvent.id}`,
            ``,
            ``,
            ``,
            `const _ = require('lodash'),`,
            `  tv4 = require('tv4'),`,
            `pm = {};`,
            ``,
            separatorComment
          ]
            .concat(exec)
            .join('\n')
        );
        return cleanEvent;
      })
    );
  }

  if (shouldRecurse) {
    //debug({saveFolder});

    accum = accum.concat(
      items.reduce((accum2, subGroup, index) => {
        let newSuffix = suffix.concat(
          (suffix.length ? String(index) : String(index + 1)).padStart(
            suffix.length,
            '0'
          )
        );
        if (name === 'root') {
          newSuffix = [String(index + 1)];
        }

        let newSaveFolder = `${saveFolder}/${newSuffix.join('_')}_${_.snakeCase(
          subGroup.name.replace(/^[\d_.\s]*/, '')
        )}`;
        mkdirp.sync(`${process.env.PMSYNC_FOLDER}/${newSaveFolder}`);

        accum2 = accum2.concat(
          countEvents(subGroup, accum, name, newSuffix, newSaveFolder)
        );
        return accum2;
      }, [])
    );
  }
  return accum;
}

module.exports = {countEvents, countRequests, trimResponses};
