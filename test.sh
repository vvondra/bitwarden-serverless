set -e

STAGE=${TRAVIS_COMMIT:-test}

serverless deploy --stage ${STAGE}
API_URL=$(serverless info --stage ${STAGE} --verbose | grep ServiceEndpoint | cut -d":" -f2- | xargs) \
  node_modules/.bin/mocha test
serverless remove --stage ${STAGE}
