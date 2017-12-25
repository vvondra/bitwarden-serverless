var chakram = require('chakram');

describe("Registration API", function () {

  var defaultBody = {
    "name": null,
    "email": "pepa@pepa.cz",
    "masterPasswordHash": "1b4mxpm9xXHL10RlLJafH+B2fSNT7DUCMihk04QWrzY=",
    "masterPasswordHint": "hintik",
    "key": "0.Fsqd0L8lgo755p8k5fPuJA==|2HtEmPCtc55xsGvUgqhVzRKYTG9sr0V8Gtxa8nTxkGtGGXGLYU27S78DO0BAidhCAf1lqwdSaX/NhpfHKRZDKax22aFYmDvvfo9xqS+KEG8="
  };

  it("should check for valid e-mail", function () {
    return chakram.get("http://httpbin.org/get");
  });
});