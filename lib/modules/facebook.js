var oauthModule = require('./oauth2')
  , url = require('url');

var fb = module.exports =
oauthModule.submodule('facebook')
  .configurable({
      scope: 'specify types of access: See http://developers.facebook.com/docs/authentication/permissions/'
  })

  .apiHost('https://graph.facebook.com')
  .oauthHost('https://graph.facebook.com')

  .authPath('/dialog/oauth')

  .entryPath('/auth/facebook')
  .callbackPath('/auth/facebook/callback')

  .authQueryParam('scope', function () {
    return this._scope && this.scope();
  })

  .buildAuthorizePath( function (isMobile) {
    var host = isMobile ? 'https://m.facebook.com' : 'https://www.facebook.com';
    return host + this.authPath();
  })

  .authCallbackDidErr( function (req) {
    var parsedUrl = url.parse(req.url, true);
    return parsedUrl.query && !!parsedUrl.query.error;
  })
  .handleAuthCallbackError( function (req, res) {
    var parsedUrl = url.parse(req.url, true)
      , errorDesc = parsedUrl.query.error_description;
    if (res.render) {
      res.render(__dirname + '/../views/auth-fail.jade', {
        errorDescription: errorDesc
      });
    } else {
      // TODO Replace this with a nice fallback
      throw new Error("You must configure handleAuthCallbackError if you are not using express");
    }
  })

  .fetchOAuthUser( function (accessToken) {
    var p = this.Promise();
    this.oauth.get(this.apiHost() + '/me', accessToken, function (err, data) {
      if (err)
        return p.fail(err);
      var oauthUser = JSON.parse(data);
      p.fulfill(oauthUser);
    })
    return p;
  })
  .convertErr( function (data) {
    return new Error(JSON.parse(data.data).error.message);
  });

fb.mobile = function (isMobile) {
  // backward compatibility only
  // it's better if application define isMobile function to handle this on a per request basis
  this.isMobile(function() {
    return isMobile;
  });
  return this;
};
