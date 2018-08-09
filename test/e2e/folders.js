var chakram = require('chakram');
var jwt = require('jsonwebtoken');
var _ = require('lodash');
var helpers = require('../helpers');
var expect = chakram.expect;

describe("Folders API", function () {
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

  var accessToken;
  var email;

  before(async () => {
      ({ accessToken, email } = await helpers.register());
  });

  it('should return error on create without authorization header', function() {
    return chakram.post(process.env.API_URL + "/api/folders", { 'Name': 'name' }).then(function (response) {
      expect(response).to.have.status(400);
    });
  });

  it('should return error on edit without authorization header', function() {
    return chakram.put(process.env.API_URL + "/api/folders/uuid", { 'Name': 'name' }).then(function (response) {
      expect(response).to.have.status(400);
    });
  });

  it('should return error on delete without authorization header', function() {
    return chakram.delete(process.env.API_URL + "/api/folders/uuid").then(function (response) {
      expect(response).to.have.status(400);
    });
  });

  describe('folder manipulation', function() {
    var folderId;

    step('allows create', function() {
      var name = "2.FQAwIBaDbczEGnEJw4g4hw==|7KreXaC0duAj0ulzZJ8ncA==|nu2sEvotjd4zusvGF8YZJPnS9SiJPDqc1VIfCrfve/o=";
      return chakram.post(
        process.env.API_URL + "/api/folders",
        { Name: name },
        { headers: { Authorization: 'Bearer ' + accessToken } }
      ).then(function(response) {
        expect(response).to.have.status(200);
        expect(response.body).to.have.property('Name', name);
        expect(response.body).to.have.property('Id');
        expect(response.body).to.have.property('RevisionDate');
        expect(response.body).to.have.property('Object', 'folder');

        folderId = response.body.Id;
      });
    });

    step('allows editing', function() {
      var newName = "2.JbFkAEZPnuMm70cdP44wtA==|fsN6nbT+udGmOWv8K4otgw==|JbtwmNQa7/48KszT2hAdxpmJ6DRPZst0EDEZx5GzesI=";
      return chakram.put(
        process.env.API_URL + "/api/folders/" + folderId,
        { Name: newName },
        { headers: { Authorization: 'Bearer ' + accessToken } }
      ).then(function(response) {
        expect(response).to.have.status(200);
        expect(response.body).to.have.property('Name', newName);
        expect(response.body).to.have.property('Id', folderId);
        expect(response.body).to.have.property('RevisionDate');
        expect(response.body).to.have.property('Object', 'folder');
      });
    });

    step('errors when editing non-existent folder', function() {
      var newName = "2.JbFkAEZPnuMm70cdP44wtA==|fsN6nbT+udGmOWv8K4otgw==|JbtwmNQa7/48KszT2hAdxpmJ6DRPZst0EDEZx5GzesI=";
      return chakram.put(
        process.env.API_URL + "/api/folders/foobar",
        { Name: newName },
        { headers: { Authorization: 'Bearer ' + accessToken } }
      ).then(function(response) {
        expect(response).to.have.status(400);
      });
    });

    step('allows delete', function() {
      return chakram.delete(
        process.env.API_URL + "/api/folders/" + folderId,
        null,
        { headers: { Authorization: 'Bearer ' + accessToken } }
      ).then(function(response) {
        expect(response).to.have.status(200);
      });
    });

    step('doesn\'t allow editing deleted folder', function() {
      var newName = "2.JbFkAEZPnuMm70cdP44wtA==|fsN6nbT+udGmOWv8K4otgw==|JbtwmNQa7/48KszT2hAdxpmJ6DRPZst0EDEZx5GzesI=";
      return chakram.put(
        process.env.API_URL + "/api/folders/" + folderId,
        { Name: newName },
        { headers: { Authorization: 'Bearer ' + accessToken } }
      ).then(function(response) {
        expect(response).to.have.status(400);
      });
    });
  });
});
