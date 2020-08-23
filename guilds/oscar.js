let client = require('../index.js');
let functions = require('../functions.js');

client.on('message', async message => {
  if (message.author.bot) return;
  if (!message.guild || message.guild.id != '677290032696131590') return;
  let args = message.content.trim().split(/ +/g);

  if (args[0] == 'test') {
    try {
      console.log(await functions.resolveUser(message, args[1], functions.checkType.GUILD, true));
    } catch (e) { console.error(e); }
  }
})