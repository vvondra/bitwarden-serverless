var chakram = require('chakram');
var _ = require('lodash');
var expect = chakram.expect;

describe("Login API", function () {
  function getRegistrationBody() {
    return {
      "name": null,
      "email": "pepa" + _.random(1000000) + "@pepa.cz",
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

  it("should return tokens if authentication successful", function () {
    var registrationBody = getRegistrationBody();
    var loginBody = getLoginBody();
    loginBody.username = registrationBody.email;

    return chakram.post(
      process.env.API_URL + "/api/accounts/register",
      registrationBody
    ).then(function(response) {
      var response = chakram.post(
        process.env.API_URL + "/identity/connect/token",
        undefined,
        {
          form: loginBody
        }
      );

      return expect(response).to.have.status(200);
    });
  });
});
