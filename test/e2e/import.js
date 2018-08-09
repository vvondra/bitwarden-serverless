var chakram = require('chakram');
var jwt = require('jsonwebtoken');
var _ = require('lodash');
var helpers = require('../helpers');
var expect = chakram.expect;

var accessToken;
var email;

before(async () => {
    ({ accessToken, email } = await helpers.register());
});

describe('Import API', () => {
    it('should return error without an authorization header', () => {
        return chakram.post(
            process.env.API_URL + "/api/ciphers/import",
            getSampleImportData()
        ).then((response) => {
            expect(response).to.have.status(400)
        });
    });

    it('should allow user imports', () => {
        return chakram.post(
            process.env.API_URL + "/api/ciphers/import",
            getSampleImportData(),
            { headers: { Authorization: 'Bearer ' + accessToken } }
        ).then((response) => {
            expect(response).to.have.status(200);
            expect(response.body).to.be.undefined;
        });
    });
});

function getSampleImportData() {
    return {
        "ciphers": [
            {
                "type": 2,
                "name": "2.8mutOOxFuyf0MweErE7yiA==|58zqqw3hpmcckDRIzNrhgA==|9j2OgbPz+SyU8vRE7dM5VaEqjmEa07id0HaH7mORrks=",
                "notes": "2.Lux5lJapv+HVdHwtSnUIEA==|D+zzv3tGxEph9PYeHcDVv+0ikVy2tdwjvSEn8dFRQm0baUAqLkAtVcLThJAaWK7nHMJlPn8X++pVq+R0pkuuEwIpWi/NurfUDMOWZ68WgCVfLP0zqpUYbUe2YLs37sXJMRiEpY3Mw+wjQITrO7vzkXQiNtgdSPd5lpgpW7n+jO51ylNBreIiEyAvmLAySoan/vbNyD3kaCpzLnbnbo4VEJ4sDShB0iXD8r6blA2ywKJ/sH/0tm+i93ouLFtbWosSyvDboYQrT8BpxPJl6CfS3zCZram8PrI6yMNpItLCoUxLfpJhHZ1rbs2wL71leVJvPYubRAU1hDTjcMwyNoMFA3Ujrh1H/NzVZzwAhajipsmndc94hNVNv+M1zr2hYv+uu92KmuIZvsG8EhQqx0/ARoEXzqWyUMGsgsy/OJMz2DHk/v7qqlKEtdC0Lm98oYPST5oWj0wfz/zDyniD9l+ycTd4zOneHHfJyECT3DoLFP2QNF+LADhUXKoDPTFvNyVXI5aTPE4NnAz2cDv2P7y7VCywhIwVU9j5yMyta3FjcgfRxldJ97PgqWPNftzRFEB8IKx7HRJdhoZTkVmDKsJgtA==|dj809ri7dCMIOIGzvBRnas2deXnV6oDHJZwbpnCF1wQ=",
                "favorite": false,
                "secureNote": {
                    "type": 0
                }
            },
            {
                "type": 1,
                "name": "2.ayprufZ7BhUjYxDK6DMQBQ==|0CzTZH7BsvsYBTfWpNuhfQ==|c7eN6rDil9QuJQZLy0b5PlbzSe1wLWlIo809ogMWAeY=",
                "notes": "2.B/CrInB2LxqFuF0XRK03/Q==|Tqo6SZlwiEX/KXl/ehohWQ==|UyXNbA7mL6PWi6TzRYCC+QACHjw/1V36iZrfXslQG7w=",
                "favorite": false,
                "login": {
                    "uris": [
                        {
                            "uri": "2.ORirqrAN/E0bVfN2yUAcgw==|gGb8eoVCqcS1Mca6Vr5IzbcLkRlUt1AjUa9c7QM6bNk=|xJmWGLme5t32ifzZ6D9c8vThTiDfIj+/POlQfUBoyy8=",
                            "match": null
                        }
                    ],
                    "username": "2.6syBprrh4y8mMw/+GJJZTw==|7S/wv1xhRiOfyBN/WM83nQ==|wiwXhpkaqVn2h5H9qXMFxzjnvX8HsUo10j834NZDs/U=",
                    "password": "2.TpFjXiL7hj/koEY1BSL+6A==|mOaPz3P6+Xx4NDrRmrQpHA==|2Ke5mpXYZ8gaupd7cpSvwB+xnMVoUeLIyIJuPHvESbc=",
                    "totp": null
                }
            },
            {
                "type": 1,
                "name": "2.B4KU+feCZzqYVtrLYwAYYw==|PRDCxaueEzhzya0JdBV0gg==|OZGg8WMxpZfkQTtAKAhdLDuXn4q3zFExezx++fPB1f8=",
                "notes": null,
                "favorite": false,
                "login": {
                    "uris": [
                        {
                            "uri": "2.eFq9WgvvBO+PVC5leaGmHg==|nLxxafUWxV6gQYm+zt/AY6dPiPp0nhQ0u115GkR4WkNxA0ZuYxwgILWmow67b6jm|RhTxN3F+xb306oAZ0R5GiHGFg1/G0y9mCYkZcG9GUv0=",
                            "match": null
                        }
                    ],
                    "username": "2.t6ZbTHpVRJu6JWuNVf+4QA==|7KJrdvQ4zTnWewF5zNsPlw==|OPrcD5Bm+6lCYOGycWDXlVbHzmuDv4hUWggGHROZu08=",
                    "password": "2.gfCb4fB9WoY3O9KmnUKKzQ==|8T6KNGqMSAbmLS68CLhgSw==|vJZnhTulKcgzKFKM41dr+JA1XmqSVjEJ0k8y7Ld4vOA=",
                    "totp": null
                }
            }
        ],
        "folders": [
            {
                "name": "2.F29HjTrBjUjtV+RPgffOcQ==|s/Y9ct0iJ78ZYupbQK4Q2w==|zV8zQxBpKPRQQ/BTXVaKqcfKabk1fW6KB40muaJ6r7Y="
            }
        ],
        "folderRelationships": [
            {
                "key": 0,
                "value": 0
            },
            {
                "key": 1,
                "value": 0
            },
            {
                "key": 2,
                "value": 0
            }
        ]
    }
}
