const express = require('express');
var app = express();

app.get('/', (req, res) => {
    res.send('Test');
})

app.listen(process.env.PORT);

/*

const lcResponse = process.env.CERTBOT_RESPONSE;

var app = express();

app.get('/.well-known/acme-challenge/:content', (req, res) => {
    res.send(lcResponse);
})

app.listen(process.env.PORT, () => {
    console.log('listening');
})
*/