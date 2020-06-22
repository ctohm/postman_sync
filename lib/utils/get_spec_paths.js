#!/usr/bin/env node

const path = require('path');

function getOpenApiAndJsonSchemaPaths({
  POSTMAN_COLLECTION_UID = '',
  POSTMAN_ENVIRONMENT_UID = '',
  OUTPUT_FOLDER = path.resolve(`${__dirname}/../../output`),
  SPECS_FOLDER,
  COLLECTIONS_FOLDER,
  ENVIRONMENTS_FOLDER
}) {
  SPECS_FOLDER = SPECS_FOLDER || path.resolve(`${OUTPUT_FOLDER}/specs`);
  COLLECTIONS_FOLDER = path.resolve(`${OUTPUT_FOLDER}/json_collections`);
  ENVIRONMENTS_FOLDER =
    ENVIRONMENTS_FOLDER || path.resolve(`${OUTPUT_FOLDER}/json_environments`);

  let openApiYamlSpecPath = path.resolve(
      `${SPECS_FOLDER}/openapi/openapi-spec.yaml`
    ),
    openApiJsonSpecPath = path.resolve(
      `${SPECS_FOLDER}/openapi/openapi-spec.json`
    ),
    jsonSchemaDereferencedPath = path.resolve(
      `${SPECS_FOLDER}/json-schema/json-schema-dereferenced.json`
    ),
    jsonSchemaPath = path.resolve(
      `${SPECS_FOLDER}/json-schema/json-schema.json`
    );
  return {
    jsonSchemaDereferencedPath,
    openApiYamlSpecPath,
    openApiJsonSpecPath,
    jsonSchemaPath
  };
}
function getPostmanSpecPaths({
  POSTMAN_COLLECTION_UID = '',
  POSTMAN_ENVIRONMENT_UID = '',
  OUTPUT_FOLDER = path.resolve(`${__dirname}/../../output`),
  SPECS_FOLDER,
  COLLECTIONS_FOLDER,
  ENVIRONMENTS_FOLDER
}) {
  SPECS_FOLDER = SPECS_FOLDER || path.resolve(`${OUTPUT_FOLDER}/specs`);
  COLLECTIONS_FOLDER = path.resolve(`${OUTPUT_FOLDER}/json_collections`);
  ENVIRONMENTS_FOLDER =
    ENVIRONMENTS_FOLDER || path.resolve(`${OUTPUT_FOLDER}/json_environments`);

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
    postmanSpecPath
  };
}

function getSwaggerpecPaths({
  POSTMAN_COLLECTION_UID = '',
  POSTMAN_ENVIRONMENT_UID = '',
  OUTPUT_FOLDER = path.resolve(`${__dirname}/../../output`),
  SPECS_FOLDER,
  COLLECTIONS_FOLDER,
  ENVIRONMENTS_FOLDER
}) {
  SPECS_FOLDER = SPECS_FOLDER || path.resolve(`${OUTPUT_FOLDER}/specs`);
  COLLECTIONS_FOLDER = path.resolve(`${OUTPUT_FOLDER}/json_collections`);
  ENVIRONMENTS_FOLDER =
    ENVIRONMENTS_FOLDER || path.resolve(`${OUTPUT_FOLDER}/json_environments`);
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
    swaggerYamlFirstExport = path.resolve(
      `${SPECS_FOLDER}/swagger/swagger.yaml`
    ),
    swaggerYamlNormalizedExport = path.resolve(
      `${SPECS_FOLDER}/swagger/swagger-spec.yaml`
    ),
    swaggerJsonFirstExport = path.resolve(
      `${SPECS_FOLDER}/swagger/swagger.json`
    ),
    swaggerJsonNormalizedExport = path.resolve(
      `${SPECS_FOLDER}/swagger/swagger-spec.json`
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
    swaggerJsonNormalizedExport
  };
}

function getAllSpecPaths({
  POSTMAN_COLLECTION_UID = '',
  POSTMAN_ENVIRONMENT_UID = '',
  OUTPUT_FOLDER = path.resolve(`${__dirname}/../../output`),
  SPECS_FOLDER,
  COLLECTIONS_FOLDER,
  ENVIRONMENTS_FOLDER
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
      ENVIRONMENTS_FOLDER
    }),
    ...getSwaggerpecPaths({
      POSTMAN_COLLECTION_UID,
      POSTMAN_ENVIRONMENT_UID,
      OUTPUT_FOLDER,
      SPECS_FOLDER,
      COLLECTIONS_FOLDER,
      ENVIRONMENTS_FOLDER
    }),
    ...getPostmanSpecPaths({
      POSTMAN_COLLECTION_UID,
      POSTMAN_ENVIRONMENT_UID,
      OUTPUT_FOLDER,
      SPECS_FOLDER,
      COLLECTIONS_FOLDER,
      ENVIRONMENTS_FOLDER
    })
  };
}
exports.getOpenApiAndJsonSchemaPaths = getOpenApiAndJsonSchemaPaths;
exports.getAllSpecPaths = getAllSpecPaths;
exports.getSwaggerpecPaths = getSwaggerpecPaths;
exports.getPostmanSpecPaths = getPostmanSpecPaths;

module.exports = getAllSpecPaths;
