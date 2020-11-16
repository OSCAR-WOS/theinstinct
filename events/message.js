const log = require('../helpers/log.js');
const sql = require('../helpers/sql.js');

const fetch = require('node-fetch');

module.exports = async (client, message) => {
  if (!message.guild || !message.guild.ready) return;

  const {channel, enabled} = message.guild.db.files;
  if (channel && enabled) message.attachments.forEach((attachment) => cacheAttachment(client, message, attachment));
};

cacheAttachment = async (client, message, attachment) => {
  if (message.author.id === client.user.id || message.author.discriminator === '0000') return;

  const {guild, channel} = message;
  attachment.downloading = true;

  try {
    const file = await fetch(attachment.url);
    const buffer = await file.buffer();

    const sent = await file(guild, {attachment: buffer, name: attachment.name});

    attachment.link = sent.url;
    client.attachments[attachment.id] = sent.url;

    await sql.insertAttachment(channel.id, attachment.id, sent.url);
    if (attachment.late) await log.send(guild, constants.Log.MESSAGE_DELETE, attachment.late.data);
  } catch { }
};

file = (guild, file) => {
  return new Promise(async (resolve, reject) => {
    try {
      return resolve(await guild.hooks.files.send({files: [file]}));
    } catch { }

    const guildChannel = guild.channels.resolve(guild.db.files.channel);
    if (!guildChannel || guildChannel.permissionsFor(guild.me).has(['SEND_MESSAGES', 'ATTACH_FILES'])) return resolve();

    try {
      resolve(await guildChannel.send({files: [file]}));
    } catch (err) {
      reject(err);
    }
  });
};
