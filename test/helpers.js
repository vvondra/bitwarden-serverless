var _ = require('lodash');
var chakram = require('chakram');

export const getRegistrationBody = () => {
    return {
        "name": null,
        "email": "pepa" + _.random(1000000) + "@pepa.cz",
        "masterPasswordHash": "r5CFRR+n9NQI8a525FY+0BPR0HGOjVJX0cR1KEMnIOo=",
        "masterPasswordHint": "hintik",
        "key": "0.Fsqd0L8lgo755p8k5fPuJA==|2HtEmPCtc55xsGvUgqhVzRKYTG9sr0V8Gtxa8nTxkGtGGXGLYU27S78DO0BAidhCAf1lqwdSaX/NhpfHKRZDKax22aFYmDvvfo9xqS+KEG8="
    };
}

export const getLoginBody = () => {
    return {
        "grant_type": "password",
        "username": "pepa" + _.random(1000000) + "@pepa.cz",
        "password": "r5CFRR+n9NQI8a525FY+0BPR0HGOjVJX0cR1KEMnIOo=",
        "scope": "api offline_access",
        "client_id": "browser",
        "deviceType": 3,
        "deviceIdentifier": "aac2e34a-44db-42ab-a733-5322dd582c3d",
        "deviceName": "firefox",
        "devicePushToken": ""
    };
}

export const register = async () => {
    let registrationBody = getRegistrationBody();
    let loginBody = getLoginBody();
    loginBody.username = registrationBody.email;
    let email = registrationBody.email;

    return chakram.post(
        process.env.API_URL + "/api/accounts/register",
        registrationBody
    ).then(function (response) {
        return chakram.post(
            process.env.API_URL + "/identity/connect/token",
            undefined,
            {
                form: loginBody
            }
        );
    }).then(function (response) {
        return {
            accessToken: response.body.access_token,
            email: email,
        };
    });
};
