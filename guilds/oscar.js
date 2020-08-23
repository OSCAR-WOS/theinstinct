let client = require('../index.js');
let functions = require('../functions.js');

client.on('message', async message => {
  if (message.author.bot) return;
  if (!message.guild || message.guild.id != '677290032696131590') return;
  try {
    let user = await functions.resolveUser(message, message.content, functions.checkType.GUILD, true);
    console.log(user);
  } catch (e) { console.error(e); }
})