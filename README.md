# Bitwarden Serverless

[![Build Status](https://travis-ci.org/vvondra/bitwarden-serverless.svg?branch=master)](https://travis-ci.org/vvondra/bitwarden-serverless)

An alternative implementation of the [Bitwarden API](https://github.com/bitwarden/core) based on a AWS Serverless stack. Inspired by [bitwarden-ruby](https://github.com/jcs/bitwarden-ruby).

  - based on the [serverless](https://serverless.com/) framework
  - should run completely within AWS Free Tier limits
  - automatic multi-zone availability

*(Note: This project is not associated with the [Bitwarden](https://bitwarden.com/) project nor 8bit Solutions LLC.)*

## Current status

- [x] Tested with Chrome extension
- [ ] Tested with Android app
- [ ] Tested with iOS app
- [ ] Tested with Web vault

## Setup

If you have AWS credentials set up, this should get you a running instance of the API. Just plug the AWS Gateway Service endpoint into your Bitwarden settings.

```bash
npm install -g serverless
npm install
# Feel free to deploy to an AWS region closer to your typical location
serverless deploy --region us-east-1
```

The deploy command will return a service URL (e.g. `https://abcd01234.execute-api.us-east-1.amazonaws.com/prod`), which you can set up in Bitwarden as your own self-hosted endpoint.

## Enable 2FA

Run `./two_factor.sh`, the script will ask you for the e-mail you want to set up two factor authentication form. Then copy the data URL with the QR code into your web browser and scan it with your authenticator app of choice. Provide one valid token to confirm the setup.

## Import existing data

**Note for all imports:** consider adding more Write capacity to the DynamoDB table for the import. The script will re-try to import the data, but it's not very well tested. A write capacity of 5 units should be safe for 500-1000 items. It can be reset to 1 afterwards.

### Bitwarden

The import script will interactively ask for your master password. This is needed since the data in the CSV must be encrypted and some data like existing folders must be decrypted.

```bash
./import.sh -e user@example.com -f export.csv -p bitwarden
```

### Lastpass

TBD

## Run on own domain

By default you will get a generated API gateway URL which is quite long. You can use the stack through a custom CNAME of your choice.

1. Have a domain under your control.
1. Issue an AWS ACM certificate for that domain in the `us-east-1` region (free). This will require you to add a verification CNAME or confirm a link on an e-mail going to that domain.
1. Wait some time until the certificate activates (1 hour?)
1. Go to the API Gateway console and under the Custom Domains section add a new mapping with your domain.
1. Add the final CNAME in your DNS configuration, the target value will be in the format `<id>.cloudfront.net`

## Motivation

I really like the idea of bitwarden-ruby and hosting my secrets under my own control. Unfortunately I don't trust my VPSes in terms of availability and crash recovery enough to host all my passwords on them.

I do however trust AWS infrastructure and with the traffic pattern needed for a password manager, I can completely fit it in Free tier while gaining multi-zone availability and basically free regular backups.

## Development

Javascript sources are transpiled using webpack and Babel to the AWS supported Node.js 6.10 target. Transpiling and bundling is part of the serverless deployment workflow.

The API is tested using blackbox integration tests against a fresh deployment on AWS. Simply run with `./test.sh` with AWS credentials configured. This will create a temporary stack in AWS, run the tests against the API and tear down the stack after completion.

## TODO

- [ ] Schema validation on input using Joi
