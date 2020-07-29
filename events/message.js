const fetch = require('node-fetch');
const fs = require('fs');

module.exports = (client, message) => {
  if (message.author.bot) return;
  if (message.guild && !message.guild.ready) return;

  if (message.guild & message.guild.db.log.files) message.attachments.forEach(attachment => cacheAttachment(message, attachment));
}

async function cacheAttachment(message, attachment) {
  try {
      if (!fs.existsSync(`./tmp/${attachment.id}`)) fs.mkdirSync(`./tmp/${attachment.id}`);
      let file = await fetch(attachment.proxyURL);
      let dest = fs.createWriteStream(`./tmp/${attachment.id}/${attachment.name}`);
      await file.body.pipe(dest);

      let channel = message.guild.channels.cache.get(message.guild.db.log.files);
      attachment.link = await channel.send({ files: [{ attachment: `./tmp/${attachment.id}/${attachment.name}`, name: attachment.name }] });
  } catch { }
}