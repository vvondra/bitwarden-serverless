var chakram = require('chakram');
var _ = require('lodash');
var expect = chakram.expect;

describe("Accounts API", function () {
  const deviceId = "aac2e34a-44db-42ab-a733-5322dd582c3d";

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
      "deviceIdentifier": deviceId,
      "deviceName": "firefox",
      "devicePushToken": ""
    };
  }

  let bearerToken;
  let email;

  before(async function() {
    var registrationBody = getRegistrationBody();
    var loginBody = getLoginBody();
    loginBody.username = registrationBody.email;
    email = registrationBody.email;

    return chakram.post(
      process.env.API_URL + "/api/accounts/register",
      registrationBody
    ).then(function (response) {
      return chakram.post(
        process.env.API_URL + "/identity/connect/token",
        undefined,
        {
          form: loginBody
        }
      );
    }).then(function (response) {
      bearerToken = response.body.access_token;
    });
  })

  it("should return account revision date", function () {
    return chakram.get(
      process.env.API_URL + "/api/accounts/revision-date",
      { headers: { Authorization: 'Bearer ' + bearerToken } }
    ).then(function (response) {
      var body = response.body;
      expect(response).to.have.status(200);
      expect(response.body).to.be.at.least((new Date()).getTime() - (20 * 1000));

      return chakram.wait();
    });
  });

  it("should return user profile", function () {
    return chakram.get(
      process.env.API_URL + "/api/accounts/profile",
      { headers: { Authorization: 'Bearer ' + bearerToken } }
    ).then(function (response) {
      var body = response.body;
      expect(response).to.have.status(200);
      expect(response.body.Email).to.equal(email);

      return chakram.wait();
    });
  });

  it("should return update user profile", function () {
    return chakram.put(
      process.env.API_URL + "/api/accounts/profile",
      {
        name: 'newname',
        culture: 'cs-CZ',
        masterPasswordHint: 'newhint',
      },
      { headers: { Authorization: 'Bearer ' + bearerToken } }
    ).then(function (response) {
      var body = response.body;
      expect(response).to.have.status(200);
      expect(body.Name).to.equal('newname');
      expect(body.Culture).to.equal('cs-CZ');
      expect(body.MasterPasswordHint).to.equal('newhint');

      return chakram.wait();
    });
  });

  it("should update push token", function () {
    return chakram.put(
      process.env.API_URL + "/api/devices/identifier/" + JSON.parse(Buffer.from(bearerToken.split('.')[1], 'base64').toString('binary')).device + "/token",
      { pushToken: 'blebleble' },
      { headers: { Authorization: 'Bearer ' + bearerToken } }
    ).then(function (response) {
      var body = response.body;
      expect(response).to.have.status(204);

      return chakram.wait();
    });
  });
});
