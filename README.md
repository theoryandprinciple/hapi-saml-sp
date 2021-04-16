# hapi-saml-sp
A Hapi plugin to wrap passport-saml for use as a SAML Service Provider.

This is a plugin that I built out of necessity when I couldn't find what I
needed anywhere.  I'm not a SAML expert, and while tests are on my TODO list
for this plugin, it was built to satisfy an immediate need and I needed it _yesterday_ so
I view this as very much an MVP (Minimum Viable Plugin).

I've tested this with samltest.id, Azure Active Directory and ADFS.  ADFS requires some
non-standard modifications to the metadata (at least, some versions of ADFS do).  Talk
to your IDP if things aren't going as expected.

RelayState is untested, as is logout.  Encrypted assertions are also untested - the
general consensus I've seen is that they don't generally add _enough_ extra security
to be worth the extra effort.

If you're interested in expanding/improving, open an issue - chances are I'd be happy to
take a PR.

## Current release
0.1.3

## Install

`npm install hapi-saml-sp`

## Configuration

Uses `http://samltest.id/` as IdP - follow the instructions there to upload your metadata.
Read passport-saml for how to use options in the `saml` section of `samlOptions` below.

Fair warning - the `passport-saml` options assume a fair bit of background knowledge and
familiarity with specialized SAML terminology.  If you don't have that, you might be better
off scrolling down to the demo app below.

```javascript
//this would be the samltest.id signing cert, from https://samltest.id/download/
const idpCert = `MII...A==`;

const samlOptions = {
    // passport saml settings
    saml: {
        //this should be the same as the assert path in config below
        callbackUrl: 'http://localhost/api/sso/v1/assert',
        //logout functionality is untested at this time.
        logoutCallbackUrl: 'http://localhost/api/sso/v1/notifylogout',
        logoutUrl: 'https://samltest.id/idp/profile/Logout',

        entryPoint: 'https://samltest.id/idp/profile/SAML2/Redirect/SSO',
        privateKey: Fs.readFileSync(__dirname + '/../../your_entity_name.key'),
        // IdP Public Signing Key
        cert: idpCert,
        issuer: 'your_entity_name'
  },
  // hapi-saml-sp settings
  config: {
      //public cert provided in metadata
      signingCert: fs.readFileSync(__dirname + '/your_entity_name.cert', 'utf-8'),
      // Plugin Routes
      routes: {
          metadata: {
              path: '/saml/metadata.xml',
              options: {
                  description: 'Fetch SAML metadata',
                    tags: ['api']
              }
          },
          assert: {
              path: '/login/saml',
              options: {
                  description: 'SAML login endpoint',
                  tags: ['api']
              }
          }
      },
      assertHooks: {
        //This will get called after your SAML identity provider sends a
        //POST request back to the assert endpoint specified above (e.g. /login/saml)
        onResponse: (profile, request, h) => {

            //your custom handling code goes in here.  I can't help much with this,
            //but you could set a cookie, or generate a JWT and h.redirect() your user to your
            //front end with that.
            return h.redirect('https://your.frontend.test);
        }
};
```

## Note: This plug in doesn't attempt to set up an auth strategy for you.

I'm assuming that you probably already have an auth strategy you're comfortable with.
If that's not the case, I've been very happy with `@hapi/jwt`.

Whatever you choose to use, you'll need to do _something_ in `assertHooks.onResponse()`
above.  This is a big difference between this library and hapi-passport-saml, so
if you'd rather have a cookie set before onResponse is ever called, it's worth giving
that a look.

## Demo application

[Demo](https://github.com/theoryandprinciple/hapi-saml-sp-demo)

## References
* [Saml2](https://github.com/Clever/saml2)
* [Passport-saml](https://github.com/bergie/passport-saml)

## Based on
* [hapi-passport-saml](https://github.com/molekilla/hapi-passport-saml)

## License
MIT
