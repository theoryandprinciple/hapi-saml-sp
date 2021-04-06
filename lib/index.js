'use strict';

const SamlController = require('./SamlController');
const HapiSaml_1 = require('./HapiSaml');
const SchemeImpl_1 = require('./SchemeImpl');

Object.defineProperty(exports, '__esModule', { value: true });

const SCHEME_NAME = 'saml';
const register = (function (server, options) {

    const hapiSaml = new HapiSaml_1.HapiSaml(options);
    const samlCredsPropKey = 'profile';
    server.auth.scheme(SCHEME_NAME, SchemeImpl_1.SchemeImpl(hapiSaml, options, samlCredsPropKey));
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
            auth: false,
            handler: SamlController.getMetadata(hapiSaml)
        }
    });
    // SAML assert
    server.route({
        method: 'POST',
        path: hapiSamlOptions.routes.assert.path,
        config: {
            auth: false,
            handler: SamlController.assert(hapiSaml.getSamlLib(), hapiSamlOptions.assertHooks.onResponse, hapiSamlOptions.assertHooks.onRequest, samlCredsPropKey)
        }
    });
});
exports.plugin = {
    register,
    pkg: require('../package.json')
};
