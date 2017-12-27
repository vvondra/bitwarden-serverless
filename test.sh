set -e

serverless deploy --stage test
API_URL=$(serverless info --stage test --verbose | grep ServiceEndpoint | cut -d":" -f2- | xargs) \
  node_modules/.bin/mocha test
serverless remove --stage test
