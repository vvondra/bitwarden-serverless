var chakram = require('chakram');
var jwt = require('jsonwebtoken');
var _ = require('lodash');
var expect = chakram.expect;

describe("Sync API", function () {
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

  function getCipherBody() {
    return {
      "type": 1,
      "folderId": null,
      "organizationId": null,
      "name": "2.d7MttWzJTSSKx1qXjHUxlQ==|01Ath5UqFZHk7csk5DVtkQ==|EMLoLREgCUP5Cu4HqIhcLqhiZHn+NsUDp8dAg1Xu0Io=",
      "notes": null,
      "favorite": true,
      "login": {
        "username": "2.JbFkAEZPnuMm70cdP44wtA==|fsN6nbT+udGmOWv8K4otgw==|JbtwmNQa7/48KszT2hAdxpmJ6DRPZst0EDEZx5GzesI=",
      }
    }
  }

  var accessToken;
  var email;

  beforeEach(function() {
    email = null;

    var registrationBody = getRegistrationBody();
    var loginBody = getLoginBody();
    loginBody.username = registrationBody.email;
    email = registrationBody.email;

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
    }).then(function(response) {
      accessToken = response.body.access_token;
    });
  })

  it('should return error without authorization header', function() {
    return chakram.get(process.env.API_URL + "/api/sync").then(function (response) {
      expect(response).to.have.status(400);
    });
  })

  it('should return user profile information', function() {
    return chakram.get(
      process.env.API_URL + "/api/sync",
      { headers: { Authorization: 'Bearer ' + accessToken } }
    ).then(function (response) {
      expect(response).to.have.status(200);
      expect(response.body.Profile.Email).to.equal(email);
      expect(response.body.Profile.Object).to.equal('profile');
      expect(response.body.Profile.Object).to.equal('profile');
      expect(response.body.Folders).to.be.an('array').that.is.empty;
      expect(response.body.Ciphers).to.be.an('array').that.is.empty;
      expect(response.body.Object).to.equal('sync');
    });
  });

  it('should return folder information', function() {
    var name = "2.FQAwIBaDbczEGnEJw4g4hw==|7KreXaC0duAj0ulzZJ8ncA==|nu2sEvotjd4zusvGF8YZJPnS9SiJPDqc1VIfCrfve/o=";
    return chakram.post(
      process.env.API_URL + "/api/folders",
      { Name: name },
      { headers: { Authorization: 'Bearer ' + accessToken } }
    ).then(function(response) {
      expect(response).to.have.status(200);

      return chakram.get(
        process.env.API_URL + "/api/sync",
        { headers: { Authorization: 'Bearer ' + accessToken } }
      )
    }).then(function (response) {
      expect(response).to.have.status(200);
      expect(response.body.Folders).to.have.lengthOf(1);
      expect(response.body.Folders[0]).to.have.property('Name', name);
      expect(response.body.Folders[0]).to.have.property('Id');
      expect(response.body.Folders[0]).to.have.property('RevisionDate');
      expect(response.body.Folders[0]).to.have.property('Object', 'folder');
    });
  });

  it('should return cipher information', function() {
    var name = "2.FQAwIBaDbczEGnEJw4g4hw==|7KreXaC0duAj0ulzZJ8ncA==|nu2sEvotjd4zusvGF8YZJPnS9SiJPDqc1VIfCrfve/o=";
    var body = getCipherBody();
    return chakram.post(
      process.env.API_URL + "/api/ciphers",
      body,
      { headers: { Authorization: 'Bearer ' + accessToken } }
    ).then(function(response) {
      expect(response).to.have.status(200);

      return chakram.get(
        process.env.API_URL + "/api/sync",
        { headers: { Authorization: 'Bearer ' + accessToken } }
      )
    }).then(function (response) {
      expect(response).to.have.status(200);
      expect(response.body.Ciphers).to.have.lengthOf(1);
      expect(response.body.Ciphers[0]).to.have.property('Id');
      expect(response.body.Ciphers[0]).to.have.property('Type', body.type);
      expect(response.body.Ciphers[0]).to.have.property('Favorite', body.favorite);
      expect(response.body.Ciphers[0]).to.have.property('Object', 'cipher');
    });
  });
});
