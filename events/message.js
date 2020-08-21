const fetch = require('node-fetch');
const fs = require('fs');
const log = require('../log.js');

module.exports = (client, message) => {
  if (message.author.bot) return;
  if (message.guild && !message.guild.ready) return;

  if (message.guild & message.guild.db.files.channel) message.attachments.forEach(attachment => cacheAttachment(message, attachment));
}

async function cacheAttachment(message, attachment) {
  attachment.downloading = true;

  try {
    let file = await fetch(attachment.url);
    let buffer = await file.buffer();

    let sent = await send(message.guild, { attachment: buffer, name: attachment.name });
    attachment.link = sent;

    if (attachment.late) await log.send(attachment.late.guild, attachment.late.data, log.Type.MESSAGE_DELETE);
  } catch { }
}

function send(guild, file) {
  return new Promise(async (resolve, reject) => {
    if (guild.hook.files) {
      try { return resolve(await guild.hook.files.send({ files: [ file ]}));
      } catch { }
    }

    let guildChannel = guild.channels.cache.find(channel => channel.id == guild.db.files.channel);
    try { resolve(await guildChannel.send({ files: [ file ]}));
    } catch (e) { reject(e); }
  })
}