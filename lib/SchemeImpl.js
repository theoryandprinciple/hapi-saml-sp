'use strict';

const SchemeAuthenticate_1 = require('./SchemeAuthenticate');

exports.SchemeImpl = (saml, options, propKey) => (server, settings) => {

    if (!settings) {
        throw new Error('Missing scheme config');
    }

    return { authenticate: SchemeAuthenticate_1.SchemeAuthenticate(saml, settings, propKey) };
};
