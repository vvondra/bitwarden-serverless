#!/usr/bin/env bash
set -e

function cleanup {
  serverless remove --stage ${STAGE}
}

trap cleanup EXIT
trap cleanup INT

./node_modules/.bin/eslint .

STAGE="test${TRAVIS_BUILD_NUMBER}"

serverless deploy --stage ${STAGE}
API_URL=$(serverless info --stage ${STAGE} --verbose | grep ServiceEndpoint | cut -d":" -f2- | xargs) \
  node_modules/.bin/mocha --timeout 5000 --require mocha-steps --colors test

