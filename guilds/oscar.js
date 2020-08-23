let client = require('../index.js');
let functions = require('../functions.js');

client.on('message', async message => {
  if (!message.guild || message.guild.id != '677290032696131590') return;

  if (message.content == 'test') {
    try { await functions.sendMessage(message.channel, functions.messageType.SUCCESS, { content: 'test', footer: 'by 123' });
    } catch (e) { console.error(e); }
  }
})