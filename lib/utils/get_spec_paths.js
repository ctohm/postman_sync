#!/usr/bin/env node

const path = require('path'),
  _ = require('lodash'),
  mkdirp = require('mkdirp');

/**
 * @typedef {Object} openApiAndJsonSchemaPaths
 * @property {string} swaggerYamlFirstExport
 * @property {string} swaggerYamlNormalizedExport
 * @property {string} swaggerJsonFirstExport
 * @property {string} swaggerJsonNormalizedExport
 * @property {string} openApiYamlSpecPath
 * @property {string} openApiJsonSpecPath
 * @property {string} jsonSchemaPath
 * @property {string} jsonSchemaDereferencedPath
 * @property {string} outputTypesPathTsFromOpenapi
 * @property {string} outputTypesPathTsFromJsonSchema
 * @property {string} outputTypeDefsPath
 * @property {string} outputTypeDefsObjectPath
 *
 */

/**
 * @typedef {Object} postmanPaths
 * @property {string} postmanEnvironmentPath
 * @property {string}  postmanMergedSpecPath
 * @property {string}  postmanForUploadPath
 * @property {string}  postmanRoutesPath
 * @property {string}  postmanNormalizedPath
 * @property {string}  postmanAncestorPath
 * @property {string}  postmanAssimilatedPath
 * @property {string}  postmanConvertedPath
 * @property {string}  postmanIndentedSpecPath
 * @property {string}  postmanReducedPath
 * @property {string}  postmanSpecPath
 */
/**
 * @typedef {Object} swaggerPaths
 * @property {string} swaggerRoutesPath
 * @property {string}  swaggerAncestorPath
 * @property {string}  swaggerAssimilatedPath
 * @property {string}  swaggerConvertedPath
 * @property {string}  swaggerIndentedSpec
 * @property {string}  swaggerRawConvertedPath
 * @property {string}  swaggerReducedPath
 * @property {string}  swaggerSpecPath
 * @property {string}  swaggerYamlFirstExport
 * @property {string}  swaggerYamlNormalizedExport
 * @property {string}  swaggerJsonFirstExport
 * @property {string}  swaggerJsonNormalizedExport
 */

/**
 *
 * @param {*} param0
 * @return {openApiAndJsonSchemaPaths}
 */
function getOpenApiAndJsonSchemaPaths({
  POSTMAN_COLLECTION_UID = '',
  POSTMAN_ENVIRONMENT_UID = '',
  OUTPUT_FOLDER = path.resolve(`${__dirname}/../../output`),
  SPECS_FOLDER,
  COLLECTIONS_FOLDER,
  ENVIRONMENTS_FOLDER,
  SPECS_PATHS = {},
}) {
  SPECS_FOLDER = SPECS_FOLDER || path.resolve(`${OUTPUT_FOLDER}/specs`);
  COLLECTIONS_FOLDER = path.resolve(`${OUTPUT_FOLDER}/json_collections`);
  ENVIRONMENTS_FOLDER =
    ENVIRONMENTS_FOLDER || path.resolve(`${OUTPUT_FOLDER}/json_environments`);

  let {
    swaggerYamlFirstExport = `${SPECS_FOLDER}/swagger/swagger.yaml`,
    swaggerYamlNormalizedExport = `${SPECS_FOLDER}/swagger/swagger-spec.yaml`,
    swaggerJsonFirstExport = `${SPECS_FOLDER}/swagger/swagger.json`,
    swaggerJsonNormalizedExport = `${SPECS_FOLDER}/swagger/swagger-spec.json`,
    openApiYamlSpecPath = `${SPECS_FOLDER}/openapi/openapi-spec.yaml`,
    openApiJsonSpecPath = `${SPECS_FOLDER}/openapi/openapi-spec.json`,
    jsonSchemaPath = `${SPECS_FOLDER}/json-schema/json-schema.json`,
    jsonSchemaDereferencedPath = `${SPECS_FOLDER}/json-schema/json-schema-dereferenced.json`,
    outputTypesPathTsFromOpenapi = `${OUTPUT_FOLDER}/types/dtsgen.from.openapi.d.ts`,
    outputTypesPathTsFromJsonSchema = `${OUTPUT_FOLDER}/types/dtsgen.from.jsonschema.d.ts`,
    outputTypeDefsPath = `${OUTPUT_FOLDER}/types/jsonschema.typedefs.js`,
    outputTypeDefsObjectPath = `${OUTPUT_FOLDER}/types/jsonschema.typedefs.json`,
  } = SPECS_PATHS;
  SPECS_PATHS = {
    swaggerYamlFirstExport,
    swaggerYamlNormalizedExport,
    swaggerJsonFirstExport,
    swaggerJsonNormalizedExport,
    openApiYamlSpecPath,
    openApiJsonSpecPath,
    jsonSchemaPath,
    jsonSchemaDereferencedPath,
    outputTypesPathTsFromOpenapi,
    outputTypesPathTsFromJsonSchema,
    outputTypeDefsPath,
    outputTypeDefsObjectPath,
  };
  _.uniq(
    Object.values(SPECS_PATHS).map((specPath) => path.dirname(specPath))
  ).forEach((dir) => mkdirp.sync(dir));
  mkdirp.sync(`${SPECS_FOLDER}/openapi`);
  mkdirp.sync(`${SPECS_FOLDER}/swagger`);
  mkdirp.sync(`${SPECS_FOLDER}/json-schema`);

  return SPECS_PATHS;
}
/**
 *
 * @param {*} param0
 * @return {postmanPaths}
 */
function getPostmanSpecPaths({
  POSTMAN_COLLECTION_UID = '',
  POSTMAN_ENVIRONMENT_UID = '',
  OUTPUT_FOLDER = path.resolve(`${__dirname}/../../output`),
  SPECS_FOLDER,
  COLLECTIONS_FOLDER,
  ENVIRONMENTS_FOLDER,
}) {
  SPECS_FOLDER = SPECS_FOLDER || path.resolve(`${OUTPUT_FOLDER}/specs`);
  COLLECTIONS_FOLDER = path.resolve(`${OUTPUT_FOLDER}/json_collections`);
  ENVIRONMENTS_FOLDER =
    ENVIRONMENTS_FOLDER || path.resolve(`${OUTPUT_FOLDER}/json_environments`);
  mkdirp.sync(ENVIRONMENTS_FOLDER);
  mkdirp.sync(COLLECTIONS_FOLDER);
  mkdirp.sync(`${SPECS_FOLDER}/postman`);

  mkdirp.sync(`${COLLECTIONS_FOLDER}/in_process`);

  let postmanAssimilatedPath = path.resolve(
      `${COLLECTIONS_FOLDER}/in_process/postman-assimilated-spec.json`
    ),
    /* Postman Paths */
    postmanAncestorPath = path.resolve(
      `${COLLECTIONS_FOLDER}/in_process/postman-ancestors.json`
    ),
    postmanNormalizedPath = path.resolve(
      `${COLLECTIONS_FOLDER}/in_process/postman-normalized-spec.json`
    ),
    postmanSpecPath = path.resolve(
      `${COLLECTIONS_FOLDER}/COLLECTION_${POSTMAN_COLLECTION_UID}.json` // una copia de lo que se descarga desde postman
    ),
    postmanEnvironmentPath = path.resolve(
      `${ENVIRONMENTS_FOLDER}/ENVIRONMENT_${POSTMAN_ENVIRONMENT_UID}.json` // una copia de lo que se descarga desde postman
    ),
    postmanConvertedPath = path.resolve(
      `${COLLECTIONS_FOLDER}/in_process/postman-converted-spec.json`
    ),
    postmanReducedPath = path.resolve(
      `${COLLECTIONS_FOLDER}/in_process/postman-reduced-spec.json`
    ),
    postmanRoutesPath = path.resolve(
      `${COLLECTIONS_FOLDER}/in_process/postman-paths.json`
    ),
    postmanForUploadPath = path.resolve(
      `${COLLECTIONS_FOLDER}/in_process/postman-for-upload.json`
    ),
    postmanMergedSpecPath = path.resolve(
      `${COLLECTIONS_FOLDER}/in_process/postman-merged-spec.json`
    ),
    postmanIndentedSpecPath = path.resolve(
      `${COLLECTIONS_FOLDER}/in_process/postman-indentation-spec.json`
    );
  return {
    postmanEnvironmentPath,
    postmanMergedSpecPath,
    postmanForUploadPath,
    postmanRoutesPath,
    postmanNormalizedPath,
    postmanAncestorPath,
    postmanAssimilatedPath,
    postmanConvertedPath,
    postmanIndentedSpecPath,
    postmanReducedPath,
    postmanSpecPath,
  };
}

/**
 *
 * @param {*} param0
 * @return {swaggerPaths}
 */
function getSwaggerpecPaths({
  POSTMAN_COLLECTION_UID = '',
  POSTMAN_ENVIRONMENT_UID = '',
  OUTPUT_FOLDER = path.resolve(`${__dirname}/../../output`),
  SPECS_FOLDER,
  COLLECTIONS_FOLDER,
  ENVIRONMENTS_FOLDER,
  SPECS_PATHS = {},
}) {
  SPECS_FOLDER = SPECS_FOLDER || path.resolve(`${OUTPUT_FOLDER}/specs`);
  COLLECTIONS_FOLDER = path.resolve(`${OUTPUT_FOLDER}/json_collections`);
  ENVIRONMENTS_FOLDER =
    ENVIRONMENTS_FOLDER || path.resolve(`${OUTPUT_FOLDER}/json_environments`);
  let {
    swaggerYamlFirstExport,
    swaggerYamlNormalizedExport,
    swaggerJsonFirstExport,
    swaggerJsonNormalizedExport,
  } = getOpenApiAndJsonSchemaPaths({
    OUTPUT_FOLDER,
    SPECS_FOLDER,
    ENVIRONMENTS_FOLDER,
    SPECS_PATHS,
  });
  /* Swagger Paths */
  let swaggerAncestorPath = path.resolve(
      `${SPECS_FOLDER}/swagger/swagger-ancestors.json`
    ),
    swaggerRawConvertedPath = path.resolve(
      `${SPECS_FOLDER}/swagger/swagger-rawconversion-spec.json`
    ),
    swaggerSpecPath = path.resolve(`${SPECS_FOLDER}/swagger/swagger-spec.json`),
    swaggerConvertedPath = path.resolve(
      `${SPECS_FOLDER}/swagger/swagger-converted-spec.json`
    ),
    swaggerReducedPath = path.resolve(
      `${SPECS_FOLDER}/swagger/swagger-reduced-spec.json`
    ),
    swaggerAssimilatedPath = path.resolve(
      `${SPECS_FOLDER}/swagger/swagger-assimilated-spec.json`
    ),
    swaggerRoutesPath = path.resolve(
      `${SPECS_FOLDER}/swagger/swagger-paths.json`
    ),
    swaggerIndentedSpec = path.resolve(
      `${SPECS_FOLDER}/swagger/swagger-indentation-spec.json`
    );
  return {
    swaggerRoutesPath,
    swaggerAncestorPath,
    swaggerAssimilatedPath,
    swaggerConvertedPath,
    swaggerIndentedSpec,
    swaggerRawConvertedPath,
    swaggerReducedPath,
    swaggerSpecPath,
    swaggerYamlFirstExport,
    swaggerYamlNormalizedExport,
    swaggerJsonFirstExport,
    swaggerJsonNormalizedExport,
  };
}
/**
 *
 * @param {*} param0
 * @return {swaggerPaths & postmanPaths & openApiAndJsonSchemaPaths }
 */
function getAllSpecPaths({
  POSTMAN_COLLECTION_UID = '',
  POSTMAN_ENVIRONMENT_UID = '',
  OUTPUT_FOLDER = path.resolve(`${__dirname}/../../output`),
  SPECS_FOLDER,
  COLLECTIONS_FOLDER,
  ENVIRONMENTS_FOLDER,
}) {
  SPECS_FOLDER = SPECS_FOLDER || path.resolve(`${OUTPUT_FOLDER}/specs`);
  COLLECTIONS_FOLDER = path.resolve(`${OUTPUT_FOLDER}/json_collections`);
  ENVIRONMENTS_FOLDER =
    ENVIRONMENTS_FOLDER || path.resolve(`${OUTPUT_FOLDER}/json_environments`);

  return {
    ...getOpenApiAndJsonSchemaPaths({
      POSTMAN_COLLECTION_UID,
      POSTMAN_ENVIRONMENT_UID,
      OUTPUT_FOLDER,
      SPECS_FOLDER,
      COLLECTIONS_FOLDER,
      ENVIRONMENTS_FOLDER,
    }),
    ...getSwaggerpecPaths({
      POSTMAN_COLLECTION_UID,
      POSTMAN_ENVIRONMENT_UID,
      OUTPUT_FOLDER,
      SPECS_FOLDER,
      COLLECTIONS_FOLDER,
      ENVIRONMENTS_FOLDER,
    }),
    ...getPostmanSpecPaths({
      POSTMAN_COLLECTION_UID,
      POSTMAN_ENVIRONMENT_UID,
      OUTPUT_FOLDER,
      SPECS_FOLDER,
      COLLECTIONS_FOLDER,
      ENVIRONMENTS_FOLDER,
    }),
  };
}

module.exports = getAllSpecPaths;
module.exports.getOpenApiAndJsonSchemaPaths = getOpenApiAndJsonSchemaPaths;
module.exports.getAllSpecPaths = getAllSpecPaths;
module.exports.getSwaggerpecPaths = getSwaggerpecPaths;
module.exports.getPostmanSpecPaths = getPostmanSpecPaths;
