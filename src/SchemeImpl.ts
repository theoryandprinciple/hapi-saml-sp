import { SchemeAuthenticate } from './SchemeAuthenticate';
import { SchemeConfig } from './SchemeConfig';
import { HapiSamlOptions } from './HapiSamlOptions';
import { HapiSaml } from './HapiSaml';

export const SchemeImpl = (
  saml: HapiSaml,
  options: HapiSamlOptions,
  propKey: string
) => (server: any, settings?: SchemeConfig | any) => {
  if (!settings) {
    throw new Error('Missing scheme config');
  }

  const cookieOptions = {
    encoding: 'iron',
    path: '/',
    password: settings.password,
    isSecure: settings.isSecure !== false, // Defaults to true
    isHttpOnly: settings.isHttpOnly !== false, // Defaults to true
    // isSameSite: 'Strict',
    ttl: settings.ttl
    //domain: settings.domain,
    //ignoreErrors: true,
    //clearInvalid: true
  };
  settings.cookie = options.config.cookieName || 'hapi-passport-saml-cookie';

  try {
    //if (!settings.cookie) {
      server.state('__'+settings.cookie, cookieOptions);
    //}
  } catch (e) {
    throw e;
  }

  return {
    authenticate: SchemeAuthenticate(saml, settings, propKey)
  };
};
