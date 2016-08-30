'use strict';

let _=require('lodash');
let express = require('express');
let router = express.Router();
let qs=require('querystring');
let config=require('config');
let requestPromise=require('request-promise');

/* GET home page. */
router.get('/', function(req, res, next) {
  let url='https://keybase.io/_/api/1.0/getsalt.json';
  let username=req.query.username;

  let opts={
    method: 'GET',
    uri: url+'?'+qs.stringify({email_or_username: username}),
    headers: {
      'Accept': 'application/json',
    },
    json: true
  };

  requestPromise(opts).then(function(kbRes) {
    res.json(kbRes);
  }).catch(function(err) {
    console.log(err);
    res.status(500).json(err);
  });
});

module.exports = router;
