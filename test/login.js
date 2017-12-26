var chakram = require('chakram');
var _ = require('lodash');
var expect = chakram.expect;

describe("Login API", function () {

  var defaultBody = {
    "grant_type": "password",
    "username": "nobody@example.com",
    "password": "r5CFRR+n9NQI8a525FY+0BPR0HGOjVJX0cR1KEMnIOo=",
    "scope": "api offline_access",
    "client_id": "browser",
    "deviceType": 3,
    "deviceIdentifier": "aac2e34a-44db-42ab-a733-5322dd582c3d",
    "deviceName": "firefox",
    "devicePushToken": ""
  };

  it("should check for request body", function () {
    var response = chakram.post(process.env.API_URL + "/api/connect/token");
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
      var body = _.omit(defaultBody, param);
      var response = chakram.post(
        process.env.API_URL + "/api/connect/token",
        body
      );
      return expect(response).to.have.status(400);
    });
  });


});