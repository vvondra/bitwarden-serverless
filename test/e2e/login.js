var chakram = require('chakram');
var jwt = require('jsonwebtoken');
var _ = require('lodash');
var expect = chakram.expect;

describe("Login API", function () {
  function getRegistrationBody() {
    return {
      "name": null,
      "email": "pepa" + _.random(1000000) + "@pepa.cz",
      "kdfIterations": 20000,
      "masterPasswordHash": "r5CFRR+n9NQI8a525FY+0BPR0HGOjVJX0cR1KEMnIOo=",
      "masterPasswordHint": "hintik",
      "key": "0.Fsqd0L8lgo755p8k5fPuJA==|2HtEmPCtc55xsGvUgqhVzRKYTG9sr0V8Gtxa8nTxkGtGGXGLYU27S78DO0BAidhCAf1lqwdSaX/NhpfHKRZDKax22aFYmDvvfo9xqS+KEG8="
    };
  }

  function getLoginBody() {
    return {
      "grant_type": "password",
      "username": "pepa" + _.random(1000000) + "@pepa.cz",
      "password": "r5CFRR+n9NQI8a525FY+0BPR0HGOjVJX0cR1KEMnIOo=",
      "scope": "api offline_access",
      "client_id": "browser",
      "deviceType": 3,
      "deviceIdentifier": "aac2e34a-44db-42ab-a733-5322dd582c3d",
      "deviceName": "firefox",
      "devicePushToken": ""
    };
  }

  function getAndroidLoginBody() {
    return {
      grant_type: 'password',
      username: 'tester@tester.cz',
      password: 'r5CFRR+n9NQI8a525FY+0BPR0HGOjVJX0cR1KEMnIOo=',
      scope: 'api offline_access',
      client_id: 'mobile',
      DeviceType: 'Android',
      DeviceIdentifier: '575e8d32-4479-4f13-936e-53201f9814e7',
      DeviceName: 'ONEPLUS A3003',
      DevicePushToken: ''
    };
  }

  function getRefreshTokenBody(token) {
    return {
      "grant_type": "refresh_token",
      "client_id": "browser",
      "refresh_token": (token || ""),
    };
  }

  describe('parameter validation', function() {
    it("should check for request body", function () {
      var response = chakram.post(process.env.API_URL + "/identity/connect/token");
      return expect(response).to.have.status(400);
    });

    [
      'client_id',
      'grant_type',
      'deviceIdentifier',
      'deviceName',
      'deviceType',
      'password',
      'scope',
      'username'
    ].forEach(function (param) {
      it("should check for " + param + " in body", function () {
        var body = _.omit(getLoginBody(), param);
        var response = chakram.post(
          process.env.API_URL + "/identity/connect/token",
          undefined,
          {
            form: body
          }
        );
        return expect(response).to.have.status(400);
      });
    });

    it("should check for invalid scope", function () {
      var body = _.set(getLoginBody(), 'scope', 'invalid');
      var response = chakram.post(
        process.env.API_URL + "/identity/connect/token",
        undefined,
        {
          form: body
        }
      );
      return expect(response).to.have.status(400);
    });
  });

  it("should fail on non-existent user", function () {
    var body = _.clone(getLoginBody());
    var response = chakram.post(
      process.env.API_URL + "/identity/connect/token",
      undefined,
      {
        form: body
      }
    );
    return expect(response).to.have.status(400);
  });

  it("should fail on password mismatch", function () {
    var registrationBody = getRegistrationBody();
    var loginBody = getLoginBody();
    loginBody.username = registrationBody.email;
    loginBody.password = "aaa";

    return chakram.post(
      process.env.API_URL + "/api/accounts/register",
      registrationBody
    ).then(function (response) {
      var response = chakram.post(
        process.env.API_URL + "/identity/connect/token",
        undefined,
        {
          form: loginBody
        }
      );

      return expect(response).to.have.status(400);
    });
  });

  it("should return prelogin info for existing account", function () {
    var registrationBody = getRegistrationBody();
    var preloginBody = {
      email: registrationBody.email
    };

    return chakram.post(
      process.env.API_URL + "/api/accounts/register",
      registrationBody
    ).then(function (response) {
      return chakram.post(
        process.env.API_URL + "/api/accounts/prelogin",
        preloginBody
      );
    }).then(function(response) {
      var body = response.body;
      expect(response).to.have.status(200);
      expect(body.Kdf).to.equal(0);
      expect(body.KdfIterations).to.equal(registrationBody.kdfIterations);

      return chakram.wait();
    });
  });

  it("should return tokens if authentication successful", function () {
    var registrationBody = getRegistrationBody();
    var loginBody = getLoginBody();
    loginBody.username = registrationBody.email;

    return chakram.post(
      process.env.API_URL + "/api/accounts/register",
      registrationBody
    ).then(function (response) {
      var response = chakram.post(
        process.env.API_URL + "/identity/connect/token",
        undefined,
        {
          form: loginBody
        }
      );

      return response;
    }).then(function (response) {
      var body = response.body;
      expect(response).to.have.status(200);

      expect(body.expires_in).to.equal(3600);
      expect(body.token_type).to.equal('Bearer');
      expect(body.Key).to.equal(registrationBody.key);
      expect(Array.isArray(body.PrivateKey)).to.equal(false);

      var decoded = jwt.decode(body.access_token, { complete: true });

      expect(decoded.payload.email).to.equal(loginBody.username);
      expect(decoded.payload.nbf).to.be.below((new Date()).getTime() / 1000);
      expect(decoded.payload.exp).to.be.above((new Date()).getTime() / 1000);
      expect(body.Kdf).to.equal(0);
      expect(body.KdfIterations).to.equal(registrationBody.kdfIterations);
      expect(body.ResetMasterPassword).to.equal(false);

      return chakram.wait();
    });
  });

  it("should return tokens if authentication successful from mobile app", function () {
    var registrationBody = getRegistrationBody();
    var loginBody = getAndroidLoginBody();
    loginBody.username = registrationBody.email;

    return chakram.post(
      process.env.API_URL + "/api/accounts/register",
      registrationBody
    ).then(function (response) {
      var response = chakram.post(
        process.env.API_URL + "/identity/connect/token",
        undefined,
        {
          form: loginBody,
          headers: {
            'Device-Type': 'Android'
          }
        }
      );

      return expect(response).to.have.status(200);
    });
  });

  describe('refresh token flow', function () {
    it("should check for token in body", function () {
      var body = _.omit(getRefreshTokenBody(), 'refresh_token');
      var response = chakram.post(
        process.env.API_URL + "/identity/connect/token",
        undefined,
        {
          form: body
        }
      );
      return expect(response).to.have.status(400);
    });

    it("should fail login for unknown refresh token", function () {
      var registrationBody = getRegistrationBody();
      var loginBody = getLoginBody();
      var refreshToken;
      var accessToken;
      loginBody.username = registrationBody.email;

      return chakram.post(
        process.env.API_URL + "/api/accounts/register",
        registrationBody
      ).then(function () {
        var response = chakram.post(
          process.env.API_URL + "/identity/connect/token",
          undefined,
          {
            form: getRefreshTokenBody("foobar")
          }
        );

        return expect(response).to.have.status(400);
      });
    });

    it("should generate a new access token when refresh token is provided", function () {
      var registrationBody = getRegistrationBody();
      var loginBody = getLoginBody();
      var refreshToken;
      var accessToken;
      loginBody.username = registrationBody.email;

      return chakram.post(
        process.env.API_URL + "/api/accounts/register",
        registrationBody
      ).then(function (response) {
        var response = chakram.post(
          process.env.API_URL + "/identity/connect/token",
          undefined,
          {
            form: loginBody
          }
        );

        return new Promise(function(resolve) {
          // Wait a second so the access token changes
          setTimeout(() => resolve(response), 1500);
        });
      }).then(function (loginResponse) {
        refreshToken = loginResponse.body.refresh_token;
        accessToken = loginResponse.body.access_token;
        var response = chakram.post(
          process.env.API_URL + "/identity/connect/token",
          undefined,
          {
            form: getRefreshTokenBody(refreshToken)
          }
        );

        return response;
      }).then(function (refreshResponse) {
        var body = refreshResponse.body;

        expect(refreshResponse).to.have.status(200);
        expect(body.refresh_token).to.equal(refreshToken);
        expect(body.access_token).not.to.equal(accessToken);
        expect(body.Key).to.equal(registrationBody.key);
        expect(body.Kdf).to.equal(0);
        expect(body.KdfIterations).to.equal(registrationBody.kdfIterations);
        expect(body.ResetMasterPassword).to.equal(false);

        return chakram.wait();
      });
    });
  });
});
