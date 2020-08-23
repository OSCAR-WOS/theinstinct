const fs = require('fs');
const { MessageEmbed } = require('discord.js');

const messageType = {
  NORMAL: 'type_normal',
  SUCCESS: 'type_success',
  ERROR: 'type_error',
  EMBED: 'type_embed'
}

module.exports.logLengthCheck = function(string) {
  if (string.length < 500 && string.split('\n').length < 5) return true;
  return false;
}

module.exports.fetchAuditLog = function(guild, type) {
  return new Promise(async (resolve, reject) => {
    try {
      let log = await guild.fetchAuditLogs({ type: type, limit: 1 });
      resolve(log.entries.first());
    } catch (e) { reject(e); }
  })
}

module.exports.loadGuildHooks = async function(client, guild) {
  guild.hook = { logs: null, files: null, blogs: null }

  if (guild.db.logs.webhook.id != null) {
    try { guild.hook.logs = await client.fetchWebhook(guild.db.logs.webhook.id, guild.db.logs.webhook.token);
    } catch { }
  }

  if (guild.db.files.webhook.id != null) {
    try { guild.hook.files = await client.fetchWebhook(guild.db.files.webhook.id, guild.db.files.webhook.token);
    } catch { }
  }
  
  if (guild.db.blogs.webhook.id != null) {
    try { guild.hook.blogs = await client.fetchWebhook(guild.db.blogs.webhook.id, guild.db.blogs.webhook.token);
    } catch { }
  }
}

module.exports.formatDisplayName = function(user, member) {
  let displayName = user.tag;

  if (member && user.username != member.displayName) displayName += ` [${member.displayName}]`;
  return displayName;
}

module.exports.setupWebhook = function(channel, name) {
  return new Promise(async (resolve, reject) => {
    try {
      let webhooks = await channel.fetchWebhooks();
      let webhook = webhooks.find(webhook => webhook.name == name && webhook.owner == channel.guild.me.user);

      if (webhook) return resolve(webhook);
      resolve(await channel.createWebhook(name, { avatar: './avatar.png' }));
    } catch (e) { reject(e); }
  })
}

module.exports.deleteMessage = async function(message, bot = false) {
  try {
    await message.delete();
    if (bot) message.botDelete = true;
  } catch { }
}

module.exports.resolveUser = function(message, id, checkString = false) {
  return new Promise(async (resolve, reject) => {
    id = id.replace('!', '');
    if (id.startsWith('<@')) id = id.slice(2, id.length - 1);

    try {
      resolve(await message.client.users.fetch(id));
    } catch (e) {
      if (!checkString) return reject(e);

      try { resolve(await resolveUserString(message, id))
      } catch (e) { reject(e); }
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
        if (member && (user.tag.toLowerCase().includes(string) || member.displayName.toLowerCase().includes(string))) return user;
      }
      return;  
    }).array();

    if (findUsers.length == 0) return resolve(null);
    if (findUsers.length == 1) return resolve(findUsers[0]);
  })
}

function translatePhrase(phrase, language) {
  const en = require('./translations/en.json');
  var translation = en[phrase];
  
  if (fs.existsSync(`./translations/${language}.json`)) {
    let lang = require(`./translations/${language}.json`);
    if (lang.hasOwnProperty(phrase)) translation = lang[phrase];
  }

  return translation;
}

function sendMessage(channel, type, data = { }) {
  return new Promise(async (resolve, reject) => {
    try {
      switch (type) {
        case messageType.NORMAL: return resolve(await message(channel, data.content));
        case messageType.EMBED: return resolve(await messageEmbed(channel, data));
        case messageType.SUCCESS: case messageType.ERROR: {
          data.color = type == messageType.SUCCESS ? 'GREEN' : 'RED';
          return resolve(await messageEmbed(channel, data));
        }
      }
    } catch (e) { reject(e); }
  })
}

function message(channel, message) {
  return new Promise(async (resolve, reject) => {
    try { resolve(await channel.send(message));
    } catch (e) { reject(e); }
  })
}

function messageEmbed(channel, data) {
  return new Promise(async (resolve, reject) => {
    let embed = new MessageEmbed();
    embed.setDescription(data.content);

    if (data.color) embed.setColor(data.color);
    if (data.footer) embed.setFooter(data.footer);

    try {
      if (!channel.guild || channel.permissionsFor(channel.guild.me).has('EMBED_LINKS')) return resolve(await channel.send(embed));
      resolve(await message(channel, data.content));
    } catch (e) { reject(e); }
  })
}

module.exports.messageType = messageType;
module.exports.translatePhrase = translatePhrase;
module.exports.sendMessage = sendMessage;