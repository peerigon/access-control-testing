// todo: deprecate config (if there are no more "global" settings that should be applied to all environments)
module.exports = {
  openApiUrl: "http://localhost:3333/openapi.yml",
  authentication: {
    useOpenApi: true,
  },
  apiBaseUrl: "http://localhost:3333",
};
