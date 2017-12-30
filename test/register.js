var chakram = require('chakram');
var _ = require('lodash');
var expect = chakram.expect;

describe("Registration API", function () {

  var defaultBody = {
    "name": null,
    "email": "pepa" + _.random(1000000) + "@pepa.cz",
    "masterPasswordHash": "1b4mxpm9xXHL10RlLJafH+B2fSNT7DUCMihk04QWrzY=",
    "masterPasswordHint": "hintik",
    "key": "0.Fsqd0L8lgo755p8k5fPuJA==|2HtEmPCtc55xsGvUgqhVzRKYTG9sr0V8Gtxa8nTxkGtGGXGLYU27S78DO0BAidhCAf1lqwdSaX/NhpfHKRZDKax22aFYmDvvfo9xqS+KEG8="
  };

  describe('parameter validation', function() {
    it("should check for request body", function () {
      var response = chakram.post(process.env.API_URL + "/api/accounts/register");
      return expect(response).to.have.status(400);
    });

    ['email', 'masterPasswordHash', 'key'].forEach(function (param) {
      it("should check for " + param + " in body", function () {
        var body = _.omit(defaultBody, param);
        var response = chakram.post(
          process.env.API_URL + "/api/accounts/register",
          body
        );
        return expect(response).to.have.status(400);
      });
    });

    it("should check for valid email", function () {
      var body = _.clone(defaultBody);
      body.email = 'bademail';
      var response = chakram.post(
        process.env.API_URL + "/api/accounts/register",
        body
      );
      return expect(response).to.have.status(400);
    });
  });

  it("should register a user account and fail in case e-mail already exists", function () {
    var body = _.clone(defaultBody);

    return chakram.post(
      process.env.API_URL + "/api/accounts/register",
      body
    ).then(function (response) {
      expect(response).to.have.status(200);

      return chakram.post(
        process.env.API_URL + "/api/accounts/register",
        body
      );
    }).then(function (response) {
      expect(response).to.have.status(400);
      // E-mails are unique case-insensitive
      body.email = body.email.toUpperCase();

      return chakram.post(
        process.env.API_URL + "/api/accounts/register",
        body
      );
    }).then(function (response) {
      expect(response).to.have.status(400);
    });
  });
});
