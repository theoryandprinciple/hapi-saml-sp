"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemeAuthenticate = (saml, settings) => (request, reply) => {
    let session = request.state[settings.cookie];
    if (!session) {
        saml.getSamlLib().getAuthorizeUrl({
            headers: request.headers,
            body: request.payload,
            query: request.query
        }, function (err, loginUrl) {
            console.log(err);
            if (err !== null) {
                return reply().code(500);
            }
            session = {};
            session.redirectTo = request.path;
            return reply.redirect(loginUrl).state(settings.cookie, session);
        });
        return;
    }
    if (session && session.profile) {
        return reply.continue({
            credentials: session.profile
        });
    }
    return reply().code(401);
};