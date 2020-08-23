let client = require('../index.js');

client.on('message', message => {
  console.log(message.content);
})