const koaStatic = require("koa-static");
const { defaultsDeep } = require("lodash/fp");

const defaults = {
  maxAge: 60000,
  defaultIndex: true,
};
module.exports = (plugin, config) => {
  const { defaultIndex, maxAge } = defaultsDeep(defaults, config);

var policy: any = async (policyContext, config, { strapi }) => {
  
if (!policyContext.request.url.includes('upload')) {
  return true;
}

  const bearerToken = policyContext.request.header?.authorization?.substring('Bearer '.length);
  if (!bearerToken) {
    return false;
  }
  const apiTokenService = strapi.services['admin::api-token'];
  const accessKey = await apiTokenService.hash(bearerToken);
  const storedToken = await apiTokenService.getBy({accessKey: accessKey});
  if (!storedToken) {
    return false;
  }
  // Deny access if expired.
  if (storedToken.expiresAt && storedToken.expiresAt < new Date()) {
    return false;
  }
 // Or add your own logic here.
  if (storedToken.type === 'full-access') {
    return true;
  }
  return false;
}

  strapi.server.routes([
    {
      method: "GET",
      path: "/uploads(.*)",
      handler: koaStatic(strapi.dirs.static.public, {
        maxage: maxAge,
        defer: true,
      }),
      config: {
        auth: false,
        policies: [
          policy      
        ],
      },
    },
  ]);
  return plugin;
};