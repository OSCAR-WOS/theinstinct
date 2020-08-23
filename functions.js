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

module.exports.sendMessage = function(channel, type, data = { }) { 
  return new Promise(async (resolve, reject) => {
    try {
      switch (type) {
        case 'success': return resolve(await channel.send(data.content));
        case 'error': return resolve(await channel.send(data.content));
      }
    } catch (e) { reject(e); }
  })
}

module.exports.setupWebhook = function(channel, name) {
  return new Promise(async (resolve, reject) => {
    try {
      if (channel.permissionsFor(channel.guild.me).has('MANAGE_WEBHOOKS')) {
        let webhooks = await channel.fetchWebhooks();
        let webhook = webhooks.find(webhook => webhook.name == name && webhook.owner == channel.guild.me.user);

        if (webhook) return resolve(webhook);
        resolve(await channel.createWebhook(name, { avatar: './avatar.png' }));
      }
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

module.exports.messageType = messageType;
module.exports.translatePhrase = translatePhrase;