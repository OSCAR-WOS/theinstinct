const fetch = require('node-fetch');

module.exports = (client, message) => {
  if (message.author.bot) return;
  if (message.guild && !message.guild.ready) return;

  if (message.guild & message.guild.db.log.files) message.attachments.forEach(attachment => cacheAttachment(message, attachment));
}

async function cacheAttachment(message, attachment) {
  try {
    //let query = await fetch(attachment.proxyURL);
    //let file = await query.buffer();

    let channel = message.guild.channels.cache.get(message.guild.db.log.files);
    let sent = await channel.send('', { files: [ attachment.proxyURL ] });
    attachment.link = sent;
  } catch { }
}