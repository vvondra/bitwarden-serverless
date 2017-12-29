var chakram = require('chakram');
var expect = chakram.expect;

describe("Fallback API", function () {
  it("should catch any URL and respond with 404", function () {
    var response = chakram.get(process.env.API_URL + "/fallback_api");

    return expect(response).to.have.status(404);
  });
});
