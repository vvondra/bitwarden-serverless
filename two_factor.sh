#!/usr/bin/env bash
set -e

STAGE=${STAGE:-prod}
REGION=${REGION:-us-east-1}

echo "Please provide the e-mail of the user you want to setup 2FA for:"

read email

serverless invoke -s "$STAGE" -r "$REGION" -f two_factor_setup -d"{\"email\": \"${email}\"}"

echo "Copy the URL above into your browser, scan the QR code in your authenticator app, and enter a code once to verify:"

read code

serverless invoke -s "$STAGE" -r "$REGION" -f two_factor_complete -d"{\"email\": \"${email}\",\"code\": \"${code}\"}"
