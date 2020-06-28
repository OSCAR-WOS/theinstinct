const fetch = require('node-fetch');

module.exports = (client, message) => {
  if (message.author.bot) return;
  if (message.guild && !message.guild.ready) return;

  if (message.guild & message.guild.db.log.files) message.attachments.forEach(attachment => cacheAttachment(message, attachment));
}

function cacheAttachment(message, attachment) {
  try {
    let query = await fetch(attachment.proxy);
    let file = await query.buffer();

    let channel = message.guild.channels.cache.get('719793949346234388');
    channel.send('', { files: file });
  } catch { }
}