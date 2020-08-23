let client = require('../index.js');
let functions = require('../functions.js');

client.on('message', async message => {
  if (message.channel.id == '746388677978095748') {
    if (message.attachments.size == 0) return functions.deleteMessage(message, true);
    //let attachments = message.attachments;
  }
})