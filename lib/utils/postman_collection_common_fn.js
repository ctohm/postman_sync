#!/usr/bin/env node

function commonPostmanCollectionFunctions(Config) {
  const Promise = require('bluebird'),
    fs = Promise.promisifyAll(require('fs')),
    path = require('path'),
    _ = require('lodash'),
    chalk = require('chalk'),
    specPaths = require(`${Config.UTILS_FOLDER}/get_spec_paths.js`)(Config),
    this_script = path.basename(__filename, path.extname(__filename)),
    debug = require('debug')(`pm_sync:${this_script}`),
    Converter = require('swagger2-postman2-parser'),
    {
      indentationReplacer,
      writeJsonIndentation
    } = require(`${Config.UTILS_FOLDER}/write-json-indentation.js`)(Config),
    entityUtils = require(`${Config.UTILS_FOLDER}/entity-utils.js`)(Config),
    normalizeCollectionIds = require(`${Config.UTILS_FOLDER}/normalize_collection_ids.js`)(
      Config
    ),
    Request = require('postman-collection').Request,
    Response = require('postman-collection').Response,
    Header = require('postman-collection').Header,
    HeaderList = require('postman-collection').HeaderList,
    PropertyList = require('postman-collection').PropertyList,
    Variable = require('postman-collection').Variable,
    VariableList = require('postman-collection').VariableList,
    Version = require('postman-collection').Version,
    Collection = require('postman-collection').Collection,
    Item = require('postman-collection').Item,
    ItemGroup = require('postman-collection').ItemGroup;

  let /* Swagger Paths */
    {
      swaggerAncestorPath,
      swaggerIndentedSpec,
      swaggerRawConvertedPath,
      swaggerSpecPath,
      swaggerConvertedPath,
      swaggerReducedPath,
      swaggerAssimilatedPath
    } = specPaths,
    /* Postman Paths */
    {
      postmanAssimilatedPath,
      postmanAncestorPath,
      postmanIndentedSpec,
      postmanSpecPath,
      postmanConvertedPath,
      postmanReducedPath
    } = specPaths;

  function something(swaggerCollection, postmanCollection) {
    return Promise.try(async () => {
      debug(
        'BEFORE: swaggerCollection has ',
        swaggerCollection.items.members.length,
        'elements'
      );
      debug('swaggerCollection.items.assimilate(postmanCollection.items);');
      swaggerCollection.items.assimilate(postmanCollection.items);
      debug(
        'AFTER: swaggerCollection has ',
        swaggerCollection.items.members.length,
        'elements'
      );

      return;
    }).catch(err => {
      console.error(err);
    });
  }
  function getTypes(elemento) {
    let types = [];
    if (!elemento) {
      return [''];
    }
    if (Response.isResponse(elemento)) {
      types.push('Response');
    }

    if (PropertyList.isPropertyList(elemento)) {
      types.push('PropertyList');
    }
    if (ItemGroup.isItemGroup(elemento)) {
      types.push('ItemGroup');
    }
    if (Item.isItem(elemento)) {
      types.push('Item');
    }
    if (Request.isRequest(elemento)) {
      types.push('Request');
    }
    if (Header.isHeader(elemento)) {
      types.push('Header');
    }
    if (HeaderList.isHeaderList(elemento)) {
      types.push('HeaderList');
    }
    if (Variable.isVariable(elemento)) {
      types.push('Variable');
    }
    if (VariableList.isVariableList(elemento)) {
      types.push('VariableList');
    }
    if (types.length !== 1) {
      debug(chalk.red(types.length), elemento);
    } else if (types.length === 0) {
      debug(elemento);
    }
    //if (Version.isVersion(elemento)) {    types.push('Version');  }
    return types;
  }
  function getMethodPath(elemento) {
    return [elemento.request.method, elemento.request.url.path.join('/')];
  }
  function debugWithParent(elemento, withDebug, from, depth) {
    if (withDebug) {
      let name = elemento.name || 'No Name',
        parentName = (elemento.parent() && elemento.parent().name) || from,
        type = getTypes(elemento)[0],
        extendedInfo = {},
        prefix = _.padStart('', 2 * depth, '--');

      if (type === 'Item') {
        name = getMethodPath(elemento).join(' ');

        parentName = elemento.parent().parent().name + '/' + parentName;
        extendedInfo = {
          types: getTypes(elemento),

          parentName,
          parentTypes: getTypes(elemento.parent()),
          itemTypes: getTypes(elemento.items)
        };
        console.log(`${prefix} ${chalk.bold.cyan(type)} ${name}  LINE 142`);
      } else if (type === 'ItemGroup') {
        name = (depth > 1 ? `${parentName}/` : '') + name;

        extendedInfo = {
          types: getTypes(elemento),
          parentName,
          depth,
          parentTypes: getTypes(elemento.parent()),
          itemTypes: getTypes(elemento.items)
        };
        console.log(`${prefix} ${chalk.green(type)} ${name}  LINE 153`);

        // Es método de instancia
      } else {
        extendedInfo = {
          types: getTypes(elemento),
          depth
        };
        console.log(`${prefix} ${type}  ${name}  LINE 161`);
      }
    }
  }

  function getNameAndId(elemento, withDebug, type) {
    let {id, name, description} = elemento;
    if (withDebug && type) {
      debug(
        elemento.parent().id,
        `${chalk.blue(type)} - ${chalk.bold.green(name)} ( ${chalk.bold.green(
          id
        )})`
      );
    }
    return {id, name, description};
  }

  function listEach(elemento, itemArray, withDebug, ancestor, depth, from) {
    from = from || 'Collection';
    depth = depth || 0;
    if (depth > 10) {
      return;
    }
    let newAncestor = ancestor;
    //let {id,name}=elemento;   debug(elemento)
    //debugWithParent(elemento, withDebug, from, depth);
    if (Response.isResponse(elemento)) {
      //prettyInspect(elemento);
      let {id, name, code, status} = elemento;

      if ([401, 403, 404].includes(code)) {
        //prettyInspect(parent);
        let parent = elemento.parent();

        let removal = ancestor.remove(id);
        debug(chalk.red('Removing '), {id, name}, 'from', {
          ancestorTypeancestorType: getTypes(ancestor)
        });
      }
      return itemArray;
    } else if (!ItemGroup.isItemGroup(elemento) && !Item.isItem(elemento)) {
      depth++;
      return itemArray.concat(
        elemento.each(item =>
          listEach(
            item,
            itemArray,
            withDebug,
            newAncestor,
            depth,
            'PropertyList'
          )
        )
      );
    } else if (ItemGroup.isItemGroup(elemento)) {
      //getNameAndId(elemento.parent(), true);

      let {id, name, description} = getNameAndId(
        elemento,
        false, // withDebug,
        'ItemGroup'
      );
      if (typeof ancestor === 'object') {
        ancestor[elemento.parent().id] = ancestor[elemento.parent().id] || {};

        ancestor[elemento.parent().id][id] = {
          id,
          name,
          description,
          type: 'ItemGroup'
        };
        newAncestor = ancestor[elemento.parent().id][id];
      }

      depth++;
      return itemArray.concat(
        listEach(
          elemento.items,
          itemArray,
          withDebug,
          newAncestor,
          depth,
          'ItemGroup'
        )
        /*elemento.items.each(item =>
        listEach(item, itemArray, withDebug, newAncestor, depth, 'ItemGroup')
      )*/
      );
    } else if (Item.isItem(elemento)) {
      //debug({from, parentTypes: getTypes(elemento.parent())});
      if (typeof ancestor === 'object') {
        let {id, name, description} = elemento.parent();
        ancestor[elemento.parent().id] = ancestor[elemento.parent().id] || {};
        ancestor[elemento.parent().id].Items =
          ancestor[elemento.parent().id].Items || [];
        try {
          ancestor[elemento.parent().id].Items.push(elemento);
        } catch (err) {
          debug('ERROR, NO ANCESTOR', ancestor, elemento.name);
        }
      }

      //  console.log(pretty({id, name, description}));

      let item = _.pick(elemento.toJSON(), ['id', 'name']),
        {request, responses} = elemento;

      if (!request) {
        debug(`${chalk.red('NO REQUEST')}`, elemento);
        return itemArray;
      }
      let {method, url} = request;
      /*debug(
      `${chalk.bold.green(elemento.parent().name)}=>${chalk.bold.blue(url)}`
    );*/
      item.depth = depth;

      item.url = getMethodPath(elemento).join(' --> ');
      item.request = {method, url};
      /*responses.members.each(response => {

          if (Response.isResponse(response)) {
            let {id, name, code, status} = response;

            if ([401, 403, 404].includes(code)) {
              //prettyInspect(parent);
              let removal = responses.remove(id);
              debug(
                chalk.red('Removing '),
                {id, name},
                'from',
                responses.id,
                removal
              );
            }
          } else {
            debug(response);
          }
        });*/
      if (PropertyList.isPropertyList(responses)) {
        let priorLength = responses.members.length,
          finalLegth = parseInt(priorLength, 10);

        responses.each(response => {
          //listEach(response, itemArray, withDebug, responses, depth, 'Request');
          if (Response.isResponse(response)) {
            let {id, name, code, status} = response;

            if ([401, 403, 404].includes(code)) {
              //prettyInspect(parent);
              responses.remove(id);
              finalLegth--;
              // debug(chalk.red('Removing '), {id, name});
            }
          }
        });
        item.responses = responses;
        /*if (priorLength !== finalLegth) {
        debug(
          `${chalk.bold.cyan(
            item.url
          )}.responses trimmed  from ${chalk.bold.yellow(
            priorLength
          )} to ${chalk.bold.green(finalLegth)} responses`
        );
      }*/
      } else {
        debug(
          `${chalk.bold.cyan(item.url)}.responses ${chalk.red(
            'is not PropertyList'
          )}`
        );
      }
      itemArray.push(item);
      return itemArray;
    }
    return;
  }
  function mapChildren({child, parent, level = 0, prefix = []}) {
    /*, {
    ownType: getTypes(child),
    name: child.name,
    parentType: getTypes(child.parent()),
    parentType2: getTypes(parent)
  });*/
    level++;
    let [all, prefixStr, cleanName] = /^([\d_.]*)(.*)/.exec(child.name);
    if (prefix.length === 0) {
      prefix = [prefixStr.trim().split(/_|\./)[0]];
    }
    cleanName = cleanName.trim();
    cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    child.name = prefix.concat([cleanName]).join('_');
    debug(' '.repeat(level) + '>  ' + child.name);
    if (ItemGroup.isItemGroup(child)) {
      let {items, ...coreChild} = child;
      coreChild.item = items.map((grandChild, index) => {
        let newPrefix = prefix.concat([index]);
        return mapChildren({
          child: grandChild,
          parent: child,
          level,
          prefix: newPrefix
        });
      });
      return coreChild;
    } else if (Item.isItem(child)) {
      if (child.responses) {
        let priorLength = child.responses.members.length;
        let {responses, ...coreChild} = child;
        responses.each(response => {
          if (Response.isResponse(response)) {
            let {id, name, code, status} = response;

            if ([401, 403, 404].includes(code)) {
              //prettyInspect(parent);
              responses.remove(id);
              // debug(chalk.red('Removing '), {id, name});
            }
          }
        });

        let finalLegth = child.responses.members.length;

        //child.responses.members = members;
        /*if (priorLength !== finalLegth) {
        debug(
          `${chalk.bold.cyan(
            child.name
          )}.responses trimmed  from ${chalk.bold.yellow(
            priorLength
          )} to ${chalk.bold.green(finalLegth)} responses`
        );
      }*/
        coreChild.response = responses.members;
        child = coreChild;
      } else {
        debug(' '.repeat(level) + child.name);
      }
    }

    if (child.events) {
      child.event = child.events;
    }
    if (child.items) {
      child.item = child.items;
    }
    if (child._) {
      if (child._.postman_id) {
        child._postman_id = child._ && child._.postman_id;
      }
      if (child._.postman_isSubFolder) {
        child._postman_isSubFolder = child._.postman_isSubFolder;
      }
    }

    child = _.omit(child, ['responses', 'events', '_', 'items']);
    return child;
  }
  return {
    getTypes,
    getMethodPath,
    debugWithParent,
    getNameAndId,
    listEach,
    mapChildren
  };
}
module.exports = commonPostmanCollectionFunctions;
