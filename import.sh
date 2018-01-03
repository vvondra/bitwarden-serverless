#!/usr/bin/env bash
set -e

display_usage() {
	echo "./import.sh -e <email> -f file.csv -p provider"
}

csv=""
email=""
provider=""

while getopts "h?e:f:p:" opt; do
    case "$opt" in
    h|\?)
        display_usage
        exit 0
        ;;
    e)  email=$OPTARG
        ;;
    f)  csv=$OPTARG
        ;;
    p)  provider=$OPTARG
        ;;
    esac
done

if [ ! -f "$csv" ] || [ -z "$email" ] || [ -z "$provider" ]
then
  display_usage
  exit 1
fi

echo -n Password:
read -s password

echo
echo "Loading CSV and importing..."

csv_payload=$(cat $csv | node -e 'require("get-stdin")().then(function(t){console.log(JSON.stringify(t))});')
echo "{\"email\": \"${email}\",\"masterPassword\": \"${password}\",\"csv\": ${csv_payload}}" | \
 serverless invoke -s $STAGE -f import_${provider}
