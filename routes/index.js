'use strict';

let _ = require('lodash');
let config = require('config');
let express = require('express');
let router = express.Router();
var crypto = require('crypto')
let qs = require('querystring');
let requestPromise = require('request-promise');

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
        //res.json(kbRes);
        let url = config.KB_BASEURL + 'login.json';
        var decodedSessionToken = new Buffer(kbRes.login_session, 'base64').toString('utf8');

        let hash = crypto.createHmac('sha512', decodedSessionToken).update(password, 'utf8').digest(
            'hex');
        console.log(kbRes.login_session, decodedSessionToken);
        console.log(hash);

        let opts = {
            method: 'POST',
            uri: url,
            headers: {
                'Accept': 'application/json',
                'X-CSRF-Token': kbRes.csrf_token
            },
            form: {
                email_or_username: username,
                hmac_pwh: hash,
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
    }).catch(function(err) {
        console.log(err);
        res.status(500).json(err);
    });
});

module.exports = router;
