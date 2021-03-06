function getRequestOptions(Config) {
  const path = require('path'),
    this_script = path.basename(__filename, path.extname(__filename)),
    debug = require('debug')(`pm_sync:${this_script}`),
    _ = require('lodash');

  function getOptionsCollection() {
    return {
      env: Config.POSTMAN_ENV,
      method: 'GET',
      url:
        'https://api.getpostman.com/collections/' +
        Config.POSTMAN_COLLECTION_UID +
        '?format=2.1.0',
      headers: {
        'Postman-Token': Config.POSTMAN_TOKEN,
        'Cache-Control': 'no-cache',
        'X-Api-Key': Config.POSTMAN_KEY,
        'Content-Type': 'application/json',
      },
      json: true,
    };
  }
  /**
   * Given the current `version`` and `info` properties for a collection,
   * return the modified properties  ` peo the normalized collection "version" and "info" properties
   * that to set theNormalizes collection version and info
   * to make it compliant with postman collection json schema
   *
   * @param  {Object}  arg1               The argument 1
   * @param  {<type>}  [arg1.version={}]  Collectoin version
   * @param  {<type>}  [arg1.info={}]     Collection "info" section
   * @param  {<type>}  [arg1.item={}]     The item
   * @return {Object}  { description_of_the_return_value }
   */
  function getCollectionVersionAndInfo({
    version = {},
    info = {name: 'My Postman Collection'},
  } = {}) {
    let {major, minor, patch} = version || {};
    let [name, old_rev] = info.name.split('rev.'),
      new_rev = old_rev,
      old_name = `${name} `.trim(),
      base_name = name.split(/\sv\d/)[0],
      new_name = [base_name, Config.API_VERSION].join(' v');

    name = new_name;
    old_rev = old_rev || 0;
    if (!major || !minor || !patch) {
      new_rev = _.padStart(1 + parseInt(old_rev, 10), 2, '0');

      new_name = [name, new_rev].join(' rev.');

      [major, minor, patch] = Config.API_VERSION.split('.');
    }
    debug('updateCollectionInfo', {
      old_name,
      new_name,
      old_rev,
      new_rev,
    });
    return {
      //id: Config.POSTMAN_COLLECTION_ID,
      name: new_name, //Config.POSTMAN_COLLECTION_NAME,
      _postman_id: Config.POSTMAN_COLLECTION_ID,
      schema:
        'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      version: {
        major: parseInt(major, 10),
        minor: parseInt(minor, 10),
        patch: parseInt(patch, 10),
        identifier: `${Config.API_VERSION} v${new_rev}`,
      },
    };
  }

  function getOptionsEnvironment() {
    let {url, ...optionsCollection} = getOptionsCollection();
    return {
      ...optionsCollection,
      url:
        'https://api.getpostman.com/environments/' +
        Config.POSTMAN_ENVIRONMENT_UID,
    };
  }
  return {
    getCollectionVersionAndInfo,
    getOptionsCollection,
    getOptionsEnvironment,
  };
}
module.exports = getRequestOptions;
