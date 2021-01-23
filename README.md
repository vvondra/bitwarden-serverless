# Bitwarden Serverless


## Current status

**In mid-2020 I have stopped using this backend for my own personal purposes and the repository is in best-effort maintainenance mode based on reported issues. I'd be more than happy to hand it over to a dedicated maintainer. Contact me at <bitwarden@vojtechvondra.cz> in case of interest or open a GH issue.**

## Description

![Integration tests](https://github.com/vvondra/bitwarden-serverless/workflows/Integration%20tests/badge.svg?branch=master)

An alternative implementation of the [Bitwarden API](https://github.com/bitwarden/core) based on a AWS Serverless stack. Inspired by [bitwarden-ruby](https://github.com/jcs/bitwarden-ruby).

  - based on the [serverless](https://serverless.com/) framework
  - should run completely within AWS Free Tier limits
  - automatic multi-zone availability

*(Note: This project is not associated with the [Bitwarden](https://bitwarden.com/) project nor 8bit Solutions LLC.)*

  * [Current status](#current-status)
  * [Setup](#setup)
  * [Upgrade](#upgrade)
  * [Enable 2FA](#enable-2fa)
  * [Import existing data](#import-existing-data)
  * [Export data](#export-data)
  * [Run on own domain](#run-on-own-domain)
  * [Motivation](#motivation)
  * [Development](#development)
  * [TODO](#todo)

- [x] Tested with Chrome extension
- [x] Tested with Android app
- [x] Tested with Desktop app (macOS)
- [x] Tested with iOS app
- [ ] Tested with Web vault (login, 2FA, and sync to read works, not tested further)

## Setup

If you have AWS credentials set up, this should get you a running instance of the API. Just plug the AWS Gateway Service endpoint into your Bitwarden settings.

```bash
npm install -g serverless
npm install
# Feel free to deploy to an AWS region closer to your typical location
serverless deploy --region us-east-1 --stage prod
```

The deploy command will return a service URL (e.g. `https://abcd01234.execute-api.us-east-1.amazonaws.com/prod`), which you can set up in Bitwarden as your own self-hosted endpoint.

## Upgrade

Simply re-deploy with `serverless deploy` from the latest checkout.

Some releases need a a database migration. A special function is deployed for this purpose, invoke with:
```bash
serverless invoke -f migrate [--stage] [--region]
```

## Enable 2FA

Run `./two_factor.sh`, the script will ask you for the e-mail you want to set up two factor authentication form. Then copy the data URL with the QR code into your web browser and scan it with your authenticator app of choice. Provide one valid token to confirm the setup.

## Import existing data

**Note for all imports:** consider adding more Write capacity to the DynamoDB table for the import. The script will re-try to import the data, but it's not very well tested. A write capacity of 5 units should be safe for 500-1000 items. It can be reset to 1 afterwards.

Go to https://help.bitwarden.com/article/export-your-data/ if you need to export your data from regular bitwarden first.

Use [bitwarden/cli](https://github.com/bitwarden/cli) to import your data.  You will need to register an account with another app beforehand.

```bash
npm install -g @bitwarden/cli
bw config server <api gateway url> # e.g. https://abcdefg.execute-api.us-east-1.amazonaws.com/prod/
bw login
# Show the help and examples for running bitwarden import
bw import --help
bw import --formats
# Import your data
bw import [format] [path]
# Example: import bitwarden CSV data:
bw import bitwardencsv export.csv
# To verify the import:
bw sync
bw list items
```

## Export data

You can export your data most easily using the official Bitwarden CLI, this server is API compatible with it.

```bash
npm install -g @bitwarden/cli
bw config server <api gateway url> # e.g. https://abcdefg.execute-api.us-east-1.amazonaws.com/prod/
# follow instructions in terminal about session env variable
bw login
bw export
```

## Run on own domain

By default you will get a generated API gateway URL which is quite long. You can use the stack through a custom CNAME of your choice.

1. Have a domain under your control.
1. Issue an AWS ACM certificate for that domain in the `us-east-1` region (free). This will require you to add a verification CNAME or confirm a link on an e-mail going to that domain.
1. Wait some time until the certificate activates (1 hour?)
1. Go to the API Gateway console and under the Custom Domains section add a new mapping with your domain.
1. Add the final CNAME in your DNS configuration, the target value will be in the following format:`<id>.cloudfront.net` for Edge-optimised or `<id>.execute-api.region.amazonaws.com`for Regional endpoint type

## Motivation

I really like the idea of bitwarden-ruby and hosting my secrets under my own control. Unfortunately I don't trust my VPSes in terms of availability and crash recovery enough to host all my passwords on them.

I do however trust AWS infrastructure and with the traffic pattern needed for a password manager, I can completely fit it in Free tier while gaining multi-zone availability and basically free regular backups.

## Development

Javascript sources are transpiled using webpack and Babel to the AWS supported Node.js 10.x target. Transpiling and bundling is part of the serverless deployment workflow.

The API is tested using blackbox integration tests against a fresh deployment on AWS. Simply run with `./test.sh` with AWS credentials configured. This will create a temporary stack in AWS, run the tests against the API and tear down the stack after completion.

## TODO

- [ ] Schema validation on input using Joi
