'use strict';

let _ = require('lodash');
let config = require('config');
let express = require('express');
let router = express.Router();
var crypto = require('crypto')
let qs = require('querystring');
let requestPromise = require('request-promise');

var scrypt = require("scrypt");
var scryptParameters = scrypt.paramsSync(0.1);

/* GET home page. */
router.get('/', function(req, res, next) {
    let url = config.KB_BASEURL + 'getsalt.json';
    let username = req.query.username || '';
    let password = req.query.password || '';

    let opts = {
        method: 'GET',
        uri: url + '?' + qs.stringify({
            email_or_username: username
        }),
        headers: {
            'Accept': 'application/json',
        },
        json: true
    };

    requestPromise(opts).then(function(kbRes) {
        let url = config.KB_BASEURL + 'login.json';
        let decodedSessionToken = new Buffer(kbRes.login_session, 'base64').toString('utf8');
        let salt = kbRes.salt;

        scrypt.hash(new Buffer(password), {
            N: Math.pow(2, 15),
            r: 8,
            p: 1
        }, 224, salt, function(err, obj) {
            if (err) {
                console.log(err);
                res.status(500).json(err)
            } else {
                let pwh = obj; //obj.toString('hex').substring(192, 224);
                let hmac_pwh = crypto.createHmac('sha512', decodedSessionToken).update(pwh,
                    'utf8').digest(
                    'hex');

                console.log('salt', salt);
                console.log('login_session', kbRes.login_session);
                console.log('decodedSessionToken', decodedSessionToken);
                console.log('hmac_pwh', hmac_pwh);

                let opts = {
                    method: 'POST',
                    uri: url,
                    headers: {
                        'Accept': 'application/json',
                        'X-CSRF-Token': kbRes.csrf_token
                    },
                    form: {
                        email_or_username: username,
                        hmac_pwh: hmac_pwh,
                        login_session: kbRes.login_session
                    }
                };

                requestPromise(opts).then(function(kbLoginRes) {
                    let kbLog = JSON.parse(kbLoginRes);
                    res.json(kbLog);
                }).catch(function(err) {
                    console.log(err);
                    res.status(500).json(err);
                });
            }

        });

    }).catch(function(err) {
        console.log(err);
        res.status(500).json(err);
    });
});

module.exports = router;
