const fetch = require('node-fetch');
const fs = require('fs');

module.exports = (client, message) => {
  if (message.author.bot) return;
  if (message.guild && !message.guild.ready) return;

  if (message.guild & message.guild.db.log.files) message.attachments.forEach(attachment => cacheAttachment(message, attachment));
}

async function cacheAttachment(message, attachment) {
  try {
      let file = await fetch(attachment.url);
      let buffer = await file.buffer();

      let channel = message.guild.channels.cache.get(message.guild.db.log.files);
      let sent = await channel.send({ files: [{ attachment: buffer, name: attachment.name }]});
      attachment.link = sent;
  } catch { }
}