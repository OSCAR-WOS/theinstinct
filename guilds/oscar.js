let client = require('../index.js');
let functions = require('../functions.js');

client.on('message', async message => {
  if (!message.guild || message.guild.id != '677290032696131590') return;
  try {
    let user = await functions.resolveUser(message, message.content, true);
    console.log(user);
  } catch (e) { console.error(e); }
})