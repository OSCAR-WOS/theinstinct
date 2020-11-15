const log = require('../helpers/log.js');
const sql = require('../helpers/sql.js');

const fetch = require('node-fetch');

module.exports = async (client, message) => {
  if (message.author.bot) return;
  if (message.guild && !message.guild.ready) return;

  if (message.guild && message.guild.db.files.channel) message.attachments.forEach((attachment) => cacheAttachment(client, message, attachment));
};

cacheAttachment = async (client, message, attachment) => {
  attachment.downloading = true;

  try {
    const file = await fetch(attachment.url);
    const buffer = await file.buffer();

    const sent = await send(message.guild, {attachment: buffer, name: attachment.name});

    attachment.link = sent.url;
    client.attachments[attachment.id] = sent.url;

    await sql.insertAttachment(message.channel.id, attachment.id, sent.url);
    if (attachment.late) await log.send(message.guild, log.Type.MESSAGE_DELETE, attachment.late.data);
  } catch { }
};

send = (guild, file) => {
  return new Promise(async (resolve, reject) => {
    if (guild.hook.files) {
      try {
        return resolve(await guild.hook.files.send({files: [file]}));
      } catch { }
    }

    const channel = guild.channels.resolve(guild.db.files.channel);
    if (!channel) return resolve();

    try {
      resolve(await channel.send({files: [file]}));
    } catch (err) {
      reject(err);
    }
  });
};
