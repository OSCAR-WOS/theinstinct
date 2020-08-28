const client = require('../index.js');
const functions = require('../functions.js');

client.on('message', async message => {
  if (message.author.bot) return;
  if (!message.guild || message.guild.id != '677290032696131590') return;
  let args = message.content.trim().split(/ +/g);
})