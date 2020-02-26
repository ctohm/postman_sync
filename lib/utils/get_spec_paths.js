#!/usr/bin/env node

const path = require('path');

const Config = require(`${process.env.CONFIG_PATH}`),
  json_collections_folder = path.resolve(
    `${process.env.PROJECT_ROOT}/json_collections`
  ),
  environments_folder = path.resolve(
    `${process.env.PROJECT_ROOT}/json_environments`
  ),
  specs_folder = path.resolve(`${process.env.PROJECT_ROOT}/specs`);

function getOpenApiAndJsonSchemaPaths() {
  let openApiYamlSpecPath = path.resolve(`${specs_folder}/openapi-spec.yaml`),
    openApiJsonSpecPath = path.resolve(`${specs_folder}/openapi-spec.json`),
    jsonSchemaDereferencedPath = path.resolve(
      `${specs_folder}/json-schema-dereferenced.json`
    ),
    jsonSchemaPath = path.resolve(`${specs_folder}/json-schema.json`);
  return {
    jsonSchemaDereferencedPath,
    openApiYamlSpecPath,
    openApiJsonSpecPath,
    jsonSchemaPath
  };
}
function getPostmanSpecPaths() {
  let postmanAssimilatedPath = path.resolve(
      `${json_collections_folder}/in_process/postman-assimilated-spec.json`
    ),
    /* Postman Paths */
    postmanAncestorPath = path.resolve(
      `${json_collections_folder}/in_process/postman-ancestors.json`
    ),
    postmanNormalizedPath = path.resolve(
      `${json_collections_folder}/in_process/postman-normalized-spec.json`
    ),
    postmanSpecPath = path.resolve(
      `${json_collections_folder}/COLLECTION_${Config.POSTMAN_COLLECTION_UID}.json` // una copia de lo que se descarga desde postman
    ),
    postmanEnvironmentPath = path.resolve(
      `${environments_folder}/ENVIRONMENT_${Config.POSTMAN_ENVIRONMENT_UID}.json` // una copia de lo que se descarga desde postman
    ),
    postmanConvertedPath = path.resolve(
      `${json_collections_folder}/in_process/postman-converted-spec.json`
    ),
    postmanReducedPath = path.resolve(
      `${json_collections_folder}/in_process/postman-reduced-spec.json`
    ),
    postmanRoutesPath = path.resolve(
      `${json_collections_folder}/in_process/postman-paths.json`
    ),
    postmanForUploadPath = path.resolve(
      `${json_collections_folder}/in_process/postman-for-upload.json`
    ),
    postmanMergedSpecPath = path.resolve(
      `${json_collections_folder}/in_process/postman-merged-spec.json`
    ),
    postmanIndentedSpecPath = path.resolve(
      `${json_collections_folder}/in_process/postman-indentation-spec.json`
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
    postmanSpecPath
  };
}

function getSwaggerpecPaths() {
  /* Swagger Paths */
  let swaggerAncestorPath = path.resolve(
      `${specs_folder}/swagger/swagger-ancestors.json`
    ),
    swaggerRawConvertedPath = path.resolve(
      `${specs_folder}/swagger/swagger-rawconversion-spec.json`
    ),
    swaggerSpecPath = path.resolve(`${specs_folder}/swagger/swagger-spec.json`),
    swaggerConvertedPath = path.resolve(
      `${specs_folder}/swagger/swagger-converted-spec.json`
    ),
    swaggerReducedPath = path.resolve(
      `${specs_folder}/swagger/swagger-reduced-spec.json`
    ),
    swaggerAssimilatedPath = path.resolve(
      `${specs_folder}/swagger/swagger-assimilated-spec.json`
    ),
    swaggerYamlFirstExport = path.resolve(
      `${specs_folder}/swagger/swagger.yaml`
    ),
    swaggerYamlNormalizedExport = path.resolve(
      `${specs_folder}/swagger/swagger-spec.yaml`
    ),
    swaggerJsonFirstExport = path.resolve(
      `${specs_folder}/swagger/swagger.json`
    ),
    swaggerJsonNormalizedExport = path.resolve(
      `${specs_folder}/swagger/swagger-spec.json`
    ),
    swaggerRoutesPath = path.resolve(
      `${specs_folder}/swagger/swagger-paths.json`
    ),
    swaggerIndentedSpec = path.resolve(
      `${specs_folder}/swagger/swagger-indentation-spec.json`
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
    swaggerJsonNormalizedExport
  };
}

function getAllSpecPaths() {
  return {
    ...getOpenApiAndJsonSchemaPaths(),
    ...getSwaggerpecPaths(),
    ...getPostmanSpecPaths()
  };
}
exports.getOpenApiAndJsonSchemaPaths = getOpenApiAndJsonSchemaPaths;
exports.getAllSpecPaths = getAllSpecPaths;
exports.getSwaggerpecPaths = getSwaggerpecPaths;
exports.getPostmanSpecPaths = getPostmanSpecPaths;

module.exports = getAllSpecPaths();
