const client = require('../index.js');
const functions = require('../functions.js');

client.on('message', async message => {
  if (message.channel.id == '746388677978095748') {
    if (message.member.permissions.has('ADMINISTRATOR')) return;
    if (message.attachments.size == 0) return functions.deleteMessage(message, true);

    let attachment = message.attachments.first();
    if (!attachment.height) return functions.deleteMessage(message, true);
  }
})