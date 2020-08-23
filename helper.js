const { MessageEmbed } = require('discord.js');
const { uuid } = require('uuidv4');
const util = require('util');
const fs = require('fs');

const messageType = {
  NO_ACCESS: 'type_noaccess',
  USAGE: 'type_usage',
  SUCCESS: 'type_sucess',
  ERROR: 'type_error',
  CODE: 'type_code',
  NORMAL: 'type_normal',
  ATTACHMENT: 'type_attachment'
}

module.exports.resolveUser = function(message, userId, checkString = false) {
  return new Promise(async (resolve, reject) => {
    userId = userId.replace('!', '');
    if (userId.startsWith('<@')) userId = userId.slice(2, userId.length - 1);

    try {
      resolve(await message.client.users.fetch(userId));
    } catch {
      try {
        if (checkString) return resolve(await resolveUserString(message, userId));
        resolve();
      } catch { resolve(); }
    }
  })
}

module.exports.resolveChannel = function(message, channelId, channelType, checkString = false) {
  return new Promise(async (resolve, reject) => {
    if (channelId.startsWith('<#')) channelId = channelId.slice(2, channelId.length - 1);

    try {
      resolve(await message.client.channels.fetch(channelId));
    } catch {
      try {
        if (checkString) return resolve(await resolveChannelString(message, channelId, channelType));
        resolve();
      } catch { resolve(); }
    }
  })
}

function resolveUserString(message, string) {
  return new Promise(async (resolve, reject) => {
    string = string.toLowerCase();

    let findUsers = message.client.users.cache.filter(user => {
      if (!message.guild && user.tag.toLowerCase().includes(string)) return user;
      else {
        let member = message.guild.member(user);
        if (member && (user.tag.toLowerCase().includes(string) || message.guild.member(user).displayName.toLowerCase().includes(string))) return user;
      }
      return;  
    }).array();

    if (findUsers.length == 0) { await sendMessage(message.channel, util.format(translatePhrase('target_notfound', message.guild ? message.guild.db.lang : process.env.lang), string), messageType.ERROR); return resolve(); }
    if (findUsers.length == 1) return resolve(findUsers[0]);

    let reply = '';

    for (let i = 0; i < findUsers.length; i++) {
      let user = findUsers[i];

      if (reply.length > 0) reply += `\n`;
      reply += `[${i}] ${user.tag} (${user.id})`;
    }

    let selection = await sendMessage(message.channel, reply, messageType.CODE);
    
    await message.channel.awaitMessages(m => m.author.id == message.author.id, { max: 1, time: 10000, errors: ['time'] })
    .then(collection => {
      let collectedMessage = collection.first();

      deleteMessage(collectedMessage, true);
      if (isNaN(collectedMessage.content)) { sendMessage(message.channel, util.format(translatePhrase('target_invalid', message.guild ? message.guild.db.lang : process.env.lang), collectedMessage.content, findUsers.length - 1), messageType.ERROR); resolve(); }
      else {
        let pick = parseInt(collectedMessage.content);
        if (pick < 0 || pick > findUsers.length - 1 || pick == 'NaN') { sendMessage(message.channel, util.format(translatePhrase('target_invalid', message.guild ? message.guild.db.lang : process.env.lang), collectedMessage.content, findUsers.length - 1), messageType.ERROR); resolve(); }

        resolve(findUsers[pick]);
      }
    })
    .catch(collection => {
      if (collection.size == 0) sendMessage(message.channel, translatePhrase('target_toolong', message.guild ? message.guild.db.lang : process.env.lang), messageType.ERROR); resolve();
    })

    deleteMessage(selection, true);
  })
}

function resolveChannelString(message, string, channelType) {
  return new Promise(async (resolve, reject) => {
    string = string.toLowerCase();

    let findChannels = message.guild.channels.cache.filter(channel => channel.name.toLowerCase().includes(string) && channel.type == channelType).array();
    if (findChannels.length == 0) { await sendMessage(message.channel, util.format(translatePhrase('target_notfound', message.guild ? message.guild.db.lang : process.env.lang), string), messageType.ERROR); return resolve(); }
    if (findChannels.length == 1) return resolve(findChannels[0]);

    let reply = '';

    for (let i = 0; i < findChannels.length; i++) {
      let guildChannel = findChannels[i];

      if (reply.length > 0) reply += `\n`;
      reply += `[${i}] ${guildChannel.name} [${guildChannel.type}] (${guildChannel.id})`;
    }

    let selection = await sendMessage(message.channel, reply, messageType.CODE);

    await message.channel.awaitMessages(m => m.author.id == message.author.id, { max: 1, time: 10000, errors: ['time'] })
    .then(async collection => {
      let collectedMessage = collection.first();

      deleteMessage(collectedMessage, true);
      if (isNaN(collectedMessage.content)) { sendMessage(message.channel, util.format(translatePhrase('target_invalid', message.guild ? message.guild.db.lang : process.env.lang), collectedMessage.content, findChannels.length - 1), messageType.ERROR); resolve(); }
      else {
        let pick = parseInt(collectedMessage.content);
        if (pick < 0 || pick > findChannels.length - 1 || pick == 'NaN') { sendMessage(message.channel, util.format(translatePhrase('target_invalid', message.guild ? message.guild.db.lang : process.env.lang), collectedMessage.content, findChannels.length - 1), messageType.ERROR); resolve(); }

        resolve(findChannels[pick]);
      }
    })
    .catch(collection => {
      if (collection.size == 0) sendMessage(message.channel, translatePhrase('target_toolong', message.guild ? message.guild.db.lang : process.env.lang), messageType.ERROR); resolve();
    })

    deleteMessage(selection, true);
  })
}



function sendMessage(channel, message, type) {
  return new Promise(async (resolve, reject) => {
    switch (type) {
      case messageType.NO_ACCESS: return resolve(await messageNoAccess(channel, message));
      case messageType.USAGE: return resolve(await messageUsage(channel, message));
      case messageType.SUCCESS: return resolve(await messageSuccess(channel, message));
      case messageType.ERROR: return resolve(await messageError(channel, message));
      case messageType.CODE: return resolve(await messageCode(channel, message));
      case messageType.NORMAL: return resolve(await messageNormal(channel, message));
      case messageType.ATTACHMENT: return resolve(await messageAttachment(channel, message));
    }
  })
}

function messageNoAccess(user, message) {
  return new Promise(async (resolve, reject) => {
    try {
      let embed = new MessageEmbed();
      embed.setDescription(message);
      embed.setColor('RED');

      resolve(await user.send(embed));
    } catch { resolve(); }
  })
}

function messageUsage(channel, message) {
  return new Promise(async (resolve, reject) => {
    try {
      let embed = new MessageEmbed();
      embed.setDescription(message);
      embed.setColor('YELLOW');

      if (!channel.guild || (channel.guild && channel.permissionsFor(channel.guild.me).has('EMBED_LINKS'))) return resolve(await channel.send(embed));
      resolve(await channel.send(message));
    } catch { resolve(); }
  })
}

function messageSuccess(channel, message) {
  return new Promise(async (resolve, reject) => {
    try {
      let embed = new MessageEmbed();
      embed.setDescription(message);
      embed.setColor('GREEN');

      if (!channel.guild || (channel.guild && channel.permissionsFor(channel.guild.me).has('EMBED_LINKS'))) return resolve(await channel.send(embed));
      resolve(await channel.send(message));
    } catch { resolve(); }
  })
}

function messageError(channel, message) {
  return new Promise(async (resolve, reject) => {
    try {
      let embed = new MessageEmbed();
      embed.setDescription(message);
      embed.setColor('RED');

      if (!channel.guild || (channel.guild && channel.permissionsFor(channel.guild.me).has('EMBED_LINKS'))) return resolve(await channel.send(embed));
      resolve(await channel.send(message));
    } catch { resolve(); }
  })
}

function messageCode(channel, message) {
  return new Promise(async (resolve, reject) => {
    try {
      resolve(await channel.send(message, { code: true }));
    } catch { resolve(); }
  })
}

function messageNormal(channel, message) {
  return new Promise(async (resolve, reject) => {
    try {
      resolve(await channel.send(message));
    } catch { resolve(); }
  })
}

function messageAttachment(channel, message) {
  return new Promise(async (resolve, reject) => {
    try {
      resolve(await channel.send(message.content, { files: [message.attachment] }));
    } catch { resolve(); }
  })
}

async function deleteMessage(message, botDelete = false) {
  try {
    await message.delete();
    if (botDelete) message.botDelete = true;
  } catch { }
}

module.exports.messageType = messageType;
module.exports.sendMessage = sendMessage;
module.exports.translatePhrase = translatePhrase;
module.exports.deleteMessage = deleteMessage;