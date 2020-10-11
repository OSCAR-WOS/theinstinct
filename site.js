const lcResponse = process.env.CERTBOT_RESPONSE;

const express = require('express');
var app = express();

app.get('/', (req, res) => {
    res.send('Test');
})

app.get('/.well-known/acme-challenge/:content', (req, res) => {
    res.send(lcResponse);
})

app.listen(process.env.PORT);