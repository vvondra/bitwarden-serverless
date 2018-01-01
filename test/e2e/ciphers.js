var chakram = require('chakram');
var jwt = require('jsonwebtoken');
var _ = require('lodash');
var expect = chakram.expect;

describe("Cipher API", function () {
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

  function getCardCipherBody() {
    return {
      "type": 3,
      "folderId": null,
      "organizationId": null,
      "name": "2.d7MttWzJTSSKx1qXjHUxlQ==|01Ath5UqFZHk7csk5DVtkQ==|EMLoLREgCUP5Cu4HqIhcLqhiZHn+NsUDp8dAg1Xu0Io=",
      "notes": null,
      "favorite": true,
      "card": {
        "number": "2.JbFkAEZPnuMm70cdP44wtA==|fsN6nbT+udGmOWv8K4otgw==|JbtwmNQa7/48KszT2hAdxpmJ6DRPZst0EDEZx5GzesI=",
      }
    }
  }

  var accessToken;
  var email;

  before(function() {
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

  it('should return error on create without authorization header', function() {
    return chakram.post(process.env.API_URL + "/api/ciphers", getCipherBody()).then(function (response) {
      expect(response).to.have.status(400);
    });
  });

  it('should return error on edit without authorization header', function() {
    return chakram.put(process.env.API_URL + "/api/ciphers/uuid", getCipherBody()).then(function (response) {
      expect(response).to.have.status(400);
    });
  });

  it('should return error on delete without authorization header', function() {
    return chakram.delete(process.env.API_URL + "/api/ciphers/uuid").then(function (response) {
      expect(response).to.have.status(400);
    });
  });

  describe('cipher manipulation', function() {
    var cipherId;
    var revisionDate;

    step('allows create', function() {
      var cipherBody = getCipherBody();

      return chakram.post(
        process.env.API_URL + "/api/ciphers",
        cipherBody,
        { headers: { Authorization: 'Bearer ' + accessToken } }
      ).then(function(response) {
        expect(response).to.have.status(200);
        expect(response.body).to.have.property('Id');
        expect(response.body.Data).to.have.property('Name', cipherBody.name);
        expect(response.body).to.have.property('Favorite', cipherBody.favorite);
        expect(response.body).to.have.property('Type', cipherBody.type);
        expect(response.body).to.have.property('RevisionDate');
        expect(response.body).to.have.property('Object', 'cipher');

        cipherId = response.body.Id;
        revisionDate = response.body.RevisionDate;
      });
    });

    step('allows editing', function() {
      var cipherBody = getCipherBody();
      cipherBody.favorite = !cipherBody.favorite;

      return chakram.put(
        process.env.API_URL + "/api/ciphers/" + cipherId,
        cipherBody,
        { headers: { Authorization: 'Bearer ' + accessToken } }
      ).then(function(response) {
        expect(response).to.have.status(200);
        expect(response.body).to.have.property('Id', cipherId);
        expect(response.body.Data).to.have.property('Name', cipherBody.name);
        expect(response.body).to.have.property('Favorite', cipherBody.favorite);
        expect(response.body).to.have.property('Type', cipherBody.type);
        expect(response.body.RevisionDate).to.be.above(revisionDate);
        expect(response.body).to.have.property('Object', 'cipher');
      });
    });

    step('errors when editing non-existent folder', function() {
      return chakram.put(
        process.env.API_URL + "/api/ciphers/foobar",
        getCipherBody(),
        { headers: { Authorization: 'Bearer ' + accessToken } }
      ).then(function(response) {
        expect(response).to.have.status(400);
      });
    });

    step('allows delete', function() {
      return chakram.delete(
        process.env.API_URL + "/api/ciphers/" + cipherId,
        null,
        { headers: { Authorization: 'Bearer ' + accessToken } }
      ).then(function(response) {
        expect(response).to.have.status(200);
      });
    });

    step('doesn\'t allow editing deleted folder', function() {
      return chakram.put(
        process.env.API_URL + "/api/folders/" + cipherId,
        getCipherBody(),
        { headers: { Authorization: 'Bearer ' + accessToken } }
      ).then(function(response) {
        expect(response).to.have.status(400);
      });
    });

    it('allows creation of credit card cipher type', function() {
      var cipherBody = getCardCipherBody();

      return chakram.post(
        process.env.API_URL + "/api/ciphers",
        cipherBody,
        { headers: { Authorization: 'Bearer ' + accessToken } }
      ).then(function(response) {
        expect(response).to.have.status(200);
        expect(response.body).to.have.property('Id');
        expect(response.body.Data).to.have.property('Name', cipherBody.name);
        expect(response.body.Data).to.have.property('Number', cipherBody.card.number);
        expect(response.body).to.have.property('Favorite', cipherBody.favorite);
        expect(response.body).to.have.property('Type', cipherBody.type);
        expect(response.body).to.have.property('RevisionDate');
        expect(response.body).to.have.property('Object', 'cipher');

        cipherId = response.body.Id;
        revisionDate = response.body.RevisionDate;
      });
    });
  });
});
