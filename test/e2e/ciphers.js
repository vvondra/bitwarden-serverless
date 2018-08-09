var chakram = require('chakram');
var helpers = require('../helpers');
var jwt = require('jsonwebtoken');
var _ = require('lodash');
var expect = chakram.expect;

describe("Cipher API", function () {

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

  before(async () => {
      ({ accessToken, email } = await helpers.register());
  });

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
        expect(response.body).to.have.property('Name', cipherBody.name);
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
        expect(response.body).to.have.property('Name', cipherBody.name);
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
        expect(response.body).to.have.property('Name', cipherBody.name);
        expect(response.body.Card).to.have.property('Number', cipherBody.card.number);
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
