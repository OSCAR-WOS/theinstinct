const log = require('../log.js');
const functions = require('../functions.js');
const sql = require('../sql.js');

const fetch = require('node-fetch');
const util = require('util');

module.exports = async (client, message) => {
  if (message.author.bot) return;
  if (message.guild && !message.guild.ready) return;

  if (message.guild & message.guild.db.files.channel) message.attachments.forEach(attachment => cacheAttachment(message, attachment));
  if (message.content.length == 0) return;

  var args;
  let prefixIndex = -1;
  if (message.guild) prefixIndex = message.content.indexOf(message.guild.db.prefix);

  if (prefixIndex == 0) args = message.content.slice(message.guild.db.prefix.length).trim().split(/ +/g);
  else {
    args = message.content.trim().split(/ +/g);

    try {
      let check = await functions.resolveUser(message, args[0], functions.checkType.GUILD);
      if (!check || check.id != client.user.id) return;
      args = args.slice(1);
    } catch { }
  }

  if (!args) return;
  args[0] = args[0].toLowerCase();

  let command = message.guild.db.commands.find(command => command.aliases.includes(args[0]));
  if (!command) return;

  let clientCommand = client.commands.find(c => c.command == command.command);
  if (!clientCommand) return;

  if (!clientCommand.channel.includes(message.channel.type)) return;
  if (clientCommand.userPermissions && !message.member.permissions.has(clientCommand.userPermissions) && !message.guild.db.managers.includes(message.author.id)) return await functions.sendMessage(message.author, functions.messageType.ERROR, { content: util.format(functions.translatePhrase('noaccess'), args[0], clientCommand.userPermissions)});
  if (clientCommand.botPermissions && !message.guild.me.permissions.has(clientCommand.botPermissions)) return await functions.sendMessage(message.channel, functions.messageType.ERROR, { content: util.format(functions.translatePhrase('noaccess_bot'), clientCommand.botPermissions)});

  try {
    await functions.deleteMessage(message, true);
    await clientCommand.run(client, message, args);
  } catch { }
}

async function cacheAttachment(message, attachment) {
  attachment.downloading = true;

  try {
    let file = await fetch(attachment.url);
    let buffer = await file.buffer();

    let sent = await send(message.guild, { attachment: buffer, name: attachment.name });
    attachment.link = sent;

    await sql.insertAttachment(message.channel, attachment.id, sent.url);
    if (attachment.late) await log.send(attachment.late.guild, attachment.late.data, log.Type.MESSAGE_DELETE);
  } catch (e) { console.error(e); }
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