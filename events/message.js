const functions = require('../helpers/functions.js');
const log = require('../helpers/log.js');
const sql = require('../helpers/sql.js');

const util = require('util');
const fetch = require('node-fetch');

module.exports = async (client, message) => {
  if (message.author.bot) return;
  if (message.guild && !message.guild.ready) return;

  if (message.guild && message.guild.db.files.channel) message.attachments.forEach((attachment) => cacheAttachment(message, attachment));
  if (message.content.length === 0) return;

  let args;
  let prefixIndex = -1;
  if (message.guild) prefixIndex = message.content.indexOf(message.guild.db.prefix);
  else prefixIndex = message.content.indexOf(process.env.prefix);

  if (prefixIndex === 0) args = message.content.slice(message.guild ? message.guild.db.prefix.length : process.env.prefix.length).trim().split(/ +/g);
  else {
    args = message.content.trim().split(/ +/g);

    try {
      const bot = await functions.resolveUser(message, args[0], message.guild ? functions.checkType.GUILD : functions.checkType.ALL);

      if (bot && bot.id === client.user.id) args = args.slice(1);
      else if (message.channel.type !== 'text') continue;
      else return;
    } catch { }
  }

  if (!args[0]) return;
  args[0] = args[0].toLowerCase();

  let commands;
  if (message.guild) commands = message.guild.db.commands;
  else commands = client.commands;

  const command = commands.find((command) => command.aliases.includes(args[0]));
  if (!command) return;

  const clientCommand = client.commands.find((c) => c.command === command.command);
  if (!clientCommand) return;

  if (!clientCommand.channel.includes(message.channel.type)) return;

  if (message.guild) {
    if (clientCommand.userPermissions && !message.member.permissions.has(clientCommand.userPermissions) && !message.guild.db.managers.includes(message.author.id)) {
      return functions.sendMessage(message.author, functions.messageType.ERROR, {content: util.format(functions.translatePhrase('noaccess'), args[0], clientCommand.userPermissions)});
    } else if (clientCommand.botPermissions && !message.guild.me.permissions.has(clientCommand.botPermissions)) {
      return functions.sendMessage(message.channel, functions.messageType.ERROR, {content: util.format(functions.translatePhrase('noaccess_bot'), clientCommand.botPermissions)});
    }
  }

  try {
    // const run = await clientCommand.run(client, message, args);
    await clientCommand.run(client, message, args);
  } catch (err) {
    console.error(err);
  }
};

cacheAttachment = async (message, attachment) => {
  attachment.downloading = true;

  try {
    const file = await fetch(attachment.url);
    const buffer = await file.buffer();

    const sent = await send(message.guild, {attachment: buffer, name: attachment.name});
    attachment.link = sent.url;

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
    if (!channel) return resolve(null);

    try {
      resolve(await channel.send({files: [file]}));
    } catch (err) {
      reject(err);
    }
  });
};
