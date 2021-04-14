'use strict';

const HapiSaml = require('./HapiSaml');
const Boom = require('@hapi/boom');
const Util = require('util');

const SCHEME_NAME = 'saml';
const register = (function (server, options) {

    const hapiSaml = new HapiSaml.HapiSaml(options);

    if (!options) {
        return Boom.badImplementation('Scheme config is Missing');
    }

    const scheme = (server, options) => {

        return {
            authenticate: (request, h) => {

                const loginUrl = new Promise((resolve, reject) => {

                    hapiSaml.getSamlLib().getAuthorizeUrl(
                        {
                            headers: request.headers,
                            body: request.payload,
                            query: request.query
                        },
                        hapiSaml.props,
                        (err, authLoginUrl) => {

                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(authLoginUrl);
                            }
                        });
                });

                const idpLoginUrl = new URL(loginUrl.toString());
                idpLoginUrl.search = `RelayState=${request.path}`;
                return h.redirect(idpLoginUrl).takeover();
            }
        };
    };

    server.auth.scheme(SCHEME_NAME, scheme);

    const hapiSamlOptions = options.config;

    if (!hapiSamlOptions.assertHooks.onRequest) {
        hapiSamlOptions.assertHooks.onRequest = (i) => { };
    }

    server.decorate('server', SCHEME_NAME, () => {

        return {
            requestLogout: (credentials, cb) => {

                const request = { user: credentials };

                if (!request.user) {
                    return cb(new Error('Missing credentials'));
                }

                hapiSaml
                    .getSamlLib()
                    .getLogoutUrl(request, hapiSaml.props, (err, url) => {

                        if (err !== null) {
                            return cb(err);
                        }

                        return cb(null, url);
                    }
                    );
            }
        };
    });
    // SAML metadata
    server.route({
        method: 'GET',
        path: hapiSamlOptions.routes.metadata.path,
        config: {
            ...hapiSamlOptions.routes.metadata.options,
            auth: false,
            handler: (request, h) => {

                const { decryptionCert, signingCert } = hapiSaml.props;
                const metaData = hapiSaml.getSamlLib().generateServiceProviderMetadata(decryptionCert, signingCert);
                const response = h.response(metaData);
                response.type('application/xml');
                return response;
            }
        }
    });
    // SAML assert
    server.route({
        method: 'POST',
        path: hapiSamlOptions.routes.assert.path,
        config: {
            ...hapiSamlOptions.routes.assert.options,
            auth: false,
            handler: async (request, h) => {

                const saml = hapiSaml.getSamlLib();
                const { onResponse } = hapiSamlOptions.assertHooks;

                if (!onResponse) {
                    return Boom.badImplementation('onResponse is Missing');
                }

                //SAML lib uses `this` liberally, don't forget to bind when promisifying
                const validatePostResponse = Util.promisify(saml.validatePostResponse.bind(saml));
                const profile = await validatePostResponse(request.payload);

                if (onResponse) {
                    // the callback shall return the reply object after using it to redirect/response.
                    //TODO: Profile is still a Promise here, need to resolve before returning so that
                    // consumers don't need to await it on the other end.
                    const replyFromCallback = onResponse(profile, request, h);
                    return replyFromCallback;
                }
            }
        }
    });
});
exports.plugin = {
    register,
    pkg: require('../package.json')
};
