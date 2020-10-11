const express = require('express');
const lcResponse = process.env.CERTBOT_RESPONSE;

var app = express();

app.get('/.well-known/acme-challenge/:content', (req, res) => {
    res.send(lcResponse);
})