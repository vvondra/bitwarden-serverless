set -e

./node_modules/.bin/eslint .

STAGE="test${TRAVIS_BUILD_NUMBER}"

serverless deploy --stage ${STAGE}
API_URL=$(serverless info --stage ${STAGE} --verbose | grep ServiceEndpoint | cut -d":" -f2- | xargs) \
  node_modules/.bin/mocha test
serverless remove --stage ${STAGE}
