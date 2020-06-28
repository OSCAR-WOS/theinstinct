const fetch = require('node-fetch');

module.exports = (client, message) => {
  if (message.author.bot) return;
  if (message.guild && !message.guild.ready) return;

  if (message.guild & message.guild.db.log.files) message.attachments.forEach(attachment => cacheAttachment(message, attachment));
}

async function cacheAttachment(message, attachment) {
  try {
    console.log('DL');
    let query = await fetch(attachment.proxyURL);
    let file = await query.buffer();

    let channel = message.guild.channels.cache.get(message.guild.db.log.files);
    let sent = await channel.send('', { files: file });

    console.log(sent);
    //attachment.link = sent.
  } catch (e) { console.error(e); }
}