const sql = require('./sql.js');

const fs = require('fs');
const util = require('util');
const {MessageEmbed, Collection} = require('discord.js');

const messageType = {
  NORMAL: 'type_normal',
  CODE: 'type_code',
  SUCCESS: 'type_success',
  ERROR: 'type_error',
  EMBED: 'type_embed',
  USAGE: 'type_usage',
};

const checkType = {
  ALL: 'all',
  GUILD: 'guild',
};

const categoryType = {
  MODERATION: 'moderation',
};

module.exports.loadGuild = (client, guild) => {
  return new Promise(async (resolve, reject) => {
    try {
      guild.db = await sql.loadGuild(client, guild.id);
      await loadGuildHooks(client, guild);
      await loadRecentAudits(guild);
      await loadMessages(client, guild);

      resolve(guild.ready = true);
    } catch (err) {
      reject(err);
    }
  });
};

module.exports.setupWebhook = (channel, name) => {
  return new Promise(async (resolve, reject) => {
    try {
      const webhooks = await channel.fetchWebhooks();
      const webhook = webhooks.find((webhook) => webhook.name === name && webhook.owner === channel.guild.me.user);

      if (webhook) return resolve(webhook);
      resolve(await channel.createWebhook(name, {avatar: './avatar.png'}));
    } catch (err) {
      reject(err);
    }
  });
};

module.exports.logLengthCheck = (string) => {
  if (string.length < 500 && string.split('\n').length < 5) return true;
  return false;
};

module.exports.resolveUser = (message, id, type, checkString = false) => {
  return new Promise(async (resolve, reject) => {
    id = id.replace('!', '');
    if (id.startsWith('<@')) id = id.slice(2, id.length - 1);

    try {
      resolve(await message.client.users.fetch(id));
    } catch (e) {
      if (!checkString) return reject(e);

      try {
        resolve(await resolveUserString(message, id.toLowerCase(), type));
      } catch (err) {
        reject(err);
      }
    }
  });
};

module.exports.resolveChannel = (message, id, type, checkString = false) => {
  return new Promise(async (resolve, reject) => {
    if (id.startsWith('<#')) id = id.slice(2, id.length - 1);

    try {
      resolve(await message.client.channels.fetch(id));
    } catch (err) {
      if (!checkString) return reject(err);

      try {
        resolve(await resolveChannelString(message, id.toLowerCase(), type));
      } catch (err) {
        reject(err);
      }
    }
  });
};

module.exports.resolveRole = (message, id) => {
  return new Promise(async (resolve, reject) => {
    if (id.startsWith('<@&')) id = id.slice(3, id.length - 1);

    try {
      const role = await message.guild.roles.fetch(id);
      if (role) return resolve(role);

      resolve(await resolveRoleString(message, id.toLowerCase()));
    } catch (err) {
      reject(err);
    }
  });
};

module.exports.formatBulkMessages = (messages, channelName = false) => {
  let string = '';
  messages = messages.sort((m1, m2) => m1.createdTimestamp - m2.createdTimestamp);

  messages.forEach((message) => {
    const displayName = formatDisplayName(message.author, message.member);

    if (message.changes) {
      for (let i = 0; i < message.changes.length; i++) {
        const edit = message.changes[i];

        if (edit.length === 0) continue;
        if (string.length > 0) string += '\n';
        string += `${new Date(edit.createdTimestamp)} ${displayName} `;

        if (channelName) string += `(#${message.channel.name}) `;
        string += `| ${edit.cleanContent}`;
      }
    }

    if (message.cleanContent.length > 0) {
      if (string.length > 0) string += '\n';
      string += `${new Date(message.createdTimestamp)} ${displayName} `;

      if (channelName) string += `(#${message.channel.name}) `;
      string += `> ${message.content}`;
    }

    if (message.attachments.size > 0) {
      const attachment = message.attachments.first();

      if (attachment.link) {
        if (string.length > 0) string += '\n';
        if (message.cleanContent.length > 0) string += util.format(translatePhrase('log_messages_bulk_attachment', message.guild.db.language), attachment.link);
        else string += `${new Date(message.createdTimestamp)} ${displayName} ${channelName ? `(#${message.channel.name})` : ''}\n${util.format(translatePhrase('log_messages_bulk_attachment', message.guild.db.language), attachment.link)}`;
      }
    }
  });

  return string;
};

module.exports.deletedUserMessages = (user, guild, messages) => {
  if (!user.messages) user.messages = {};
  return user.messages[guild.id] = messages;

  /*
  if (!user.messages[guild.id]) user.messages[guild.id] = new Collection();

  return messages.forEach((message) => {
    user.messages[guild.id].set(message.id, message);
  });
  */
};

fetchAuditLog = (guild, type) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!guild.me.permissions.has('VIEW_AUDIT_LOG')) return resolve();

      const log = await guild.fetchAuditLogs({type, limit: 1});
      resolve(log.entries.first());
    } catch (err) {
      reject(err);
    }
  });
};

loadGuildHooks = (client, guild) => {
  return new Promise(async (resolve, reject) => {
    guild.hook = {logs: null, files: null, blogs: null};

    if (guild.db.logs.webhook.id != null) {
      try {
        guild.hook.logs = await client.fetchWebhook(guild.db.logs.webhook.id, guild.db.logs.webhook.token);
      } catch { }
    }

    if (guild.db.files.webhook.id != null) {
      try {
        guild.hook.files = await client.fetchWebhook(guild.db.files.webhook.id, guild.db.files.webhook.token);
      } catch { }
    }

    if (guild.db.blogs.webhook.id != null) {
      try {
        guild.hook.blogs = await client.fetchWebhook(guild.db.blogs.webhook.id, guild.db.blogs.webhook.token);
      } catch { }
    }

    resolve();
  });
};

loadRecentAudits = (guild) => {
  return new Promise(async (resolve, reject) => {
    guild.audit = {kick: null, ban: null, message: null, update: null};

    try {
      guild.audit.kick = await fetchAuditLog(guild, 'MEMBER_KICK');
    } catch { }

    try {
      guild.audit.ban = await fetchAuditLog(guild, 'MEMBER_BAN_ADD');
    } catch { }

    try {
      guild.audit.message = await fetchAuditLog(guild, 'MESSAGE_DELETE');
    } catch { }

    try {
      guild.audit.update = await fetchAuditLog(guild, 'MEMBER_UPDATE');
    } catch { }

    resolve();
  });
};

loadMessages = (client, guild) => {
  return new Promise(async (resolve, reject) => {
    const channels = guild.channels.cache.filter((channel) => channel.type === 'text' && channel.permissionsFor(guild.me).has(['VIEW_CHANNEL', 'READ_MESSAGE_HISTORY'])).array();

    for (let i = 0; i < channels.length; i++) {
      const channel = channels[i];
      let messages;

      try {
        messages = await channel.messages.fetch({limit: 100});
      } catch { }
      if (!messages) break;

      messages = messages.filter((message) => message.attachments.size > 0).array();

      for (let x = 0; x < messages.length; x++) {
        const message = messages[x];
        const attachment = message.attachments.first();
        let query;

        try {
          query = await sql.findAttachment(channel.id, attachment.id);
          await sql.keepAttachment(query._id);
        } catch { }
        if (!query) break;

        attachment.link = query.url;
        client.attachments[attachment.id] = query.url;
      }
    }

    resolve();
  });
};

resolveUserString = (message, string, type) => {
  return new Promise(async (resolve, reject) => {
    let users;

    if (type === checkType.ALL) users = message.client.users.cache;
    else {
      try {
        users = await message.guild.members.fetch();
        users = users.mapValues((member) => member.user);
      } catch (err) {
        reject(err);
      }
    }

    users = users.filter((user) => {
      if (message.guild) {
        const member = message.guild.member(user);
        if (member && member.displayName.toLowerCase().includes(string)) return user;
      }

      if (user.tag.toLowerCase().includes(string)) return user;
    }).array();

    let reply = '';
    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      if (reply.length > 0) reply += '\n';
      reply += `[${i}] ${formatDisplayName(user, message.guild ? message.guild.member(user) : null)} (${user.id})`;
    }

    try {
      resolve(await resolveMessage(message, reply, string, users));
    } catch (err) {
      reject(err);
    }
  });
};

resolveChannelString = (message, string, type) => {
  return new Promise(async (resolve, reject) => {
    const channels = message.guild.channels.cache.filter((channel) => channel.name.toLowerCase().includes(string) && channel.type === type).array();

    let reply = '';
    for (let i = 0; i < channels.length; i++) {
      const channel = channels[i];

      if (reply.length > 0) reply += '\n';
      reply += `[${i}] ${channel.name} [${channel.type}] (${channel.id})`;
    }

    try {
      resolve(await resolveMessage(message, reply, string, channels));
    } catch (err) {
      reject(err);
    }
  });
};

resolveRoleString = (message, string) => {
  return new Promise(async (resolve, reject) => {
    const roles = message.guild.roles.cache.filter((role) => role.name.toLowerCase().includes(string)).array();

    let reply = '';
    for (let i = 0; i < roles.length; i++) {
      const role = roles[i];

      if (reply.length > 0) reply += '\n';
      reply += `[${i}] ${role.name} ({${role.id}})`;
    }

    try {
      resolve(await resolveMessage(message, reply, string, channels));
    } catch (err) {
      reject(err);
    }
  });
};

resolveMessage = (message, reply, string, array) => {
  return new Promise(async (resolve, reject) => {
    if (array.length === 1) return resolve(array[0]);

    if (array.length === 0) {
      await sendMessage(message.channel, messageType.ERROR, {content: util.format(translatePhrase('target_notfound', message.guild ? message.guild.db.language : process.env.language), string)});
      return resolve();
    }

    let code;
    try {
      code = await sendMessage(message.channel, messageType.CODE, {content: reply});
    } catch (err) {
      return reject(e);
    }

    let collection;
    try {
      collection = await message.channel.awaitMessages((m) => m.author.id === message.author.id, {max: 1, time: 10000, errors: ['time']});
    } catch (err) {
      await sendMessage(message.channel, messageType.ERROR, {content: translatePhrase('target_toolong', message.guild ? message.guild.db.language : process.env.language)});
      return resolve();
    } finally {
      if (message.guild) {
        code.forEach(async (c) => {
          try {
            await deleteMessage(c, true);
          } catch { }
        });
      }
    }

    const first = collection.first();
    try {
      await deleteMessage(first, true);
    } catch { }

    if (!first) return resolve();

    const pick = parseInt(first.content);
    if (isNaN(pick) || pick < 0 || pick > array.length - 1) {
      await sendMessage(message.channel, messageType.ERROR, {content: util.format(translatePhrase('target_invalid', message.guild ? message.guild.db.language : process.env.language), first.content, array.length - 1)});
      return resolve();
    }

    resolve(array[pick]);
  });
};

formatDisplayName = (user, member) => {
  let displayName = user.tag;

  if (member && user.username !== member.displayName) {
    displayName += ` [${member.displayName}]`;
  }

  return displayName;
};

translatePhrase = (phrase, language) => {
  const en = require('../translations/en.json');
  const translation = en[phrase];

  if (fs.existsSync(`../translations/${language}.json`)) {
    const lang = require(`../translations/${language}.json`);
    if (lang.hasOwnProperty(phrase)) translation = lang[phrase];
  }

  return translation;
};

deleteMessage = (message, bot = false) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (bot) message.botDelete = true;
      resolve(await message.delete());
    } catch (err) {
      reject(err);
    }
  });
};

sendMessage = (channel, type, data = { }) => {
  return new Promise(async (resolve, reject) => {
    if (channel.guild && !channel.permissionsFor(channel.guild.me).has('SEND_MESSAGES')) return resolve();

    try {
      switch (type) {
        case messageType.NORMAL: return resolve(await message(channel, data.content));
        case messageType.EMBED: return resolve(await messageEmbed(channel, data));
        case messageType.CODE: return resolve(await messageCode(channel, data.content));
        case messageType.SUCCESS: case messageType.ERROR: case messageType.USAGE: {
          switch (type) {
            case messageType.SUCCESS: data.color = 'GREEN'; break;
            case messageType.ERROR: data.color = 'RED'; break;
            case messageType.USAGE: data.color = 'YELLOW'; break;
          }

          return resolve(await messageEmbed(channel, data));
        }
      }
    } catch (err) {
      reject(err);
    }
  });
};

message = (channel, message) => {
  return new Promise(async (resolve, reject) => {
    try {
      resolve(await channel.send(message));
    } catch (err) {
      reject(err);
    }
  });
};

messageEmbed = (channel, data) => {
  return new Promise(async (resolve, reject) => {
    const embed = new MessageEmbed();
    embed.setDescription(data.content);

    if (data.color) embed.setColor(data.color);
    if (data.footer) embed.setFooter(data.footer);

    try {
      if (!channel.guild || channel.permissionsFor(channel.guild.me).has('EMBED_LINKS')) return resolve(await channel.send(embed));
      resolve(await message(channel, data.content));
    } catch (err) {
      reject(err);
    }
  });
};

messageCode = (channel, message) => {
  return new Promise(async (resolve, reject) => {
    try {
      resolve(await channel.send(message, {code: true, split: true}));
    } catch (err) {
      reject(err);
    }
  });
};

module.exports.checkType = checkType;
module.exports.messageType = messageType;
module.exports.categoryType = categoryType;

module.exports.fetchAuditLog = fetchAuditLog;
module.exports.formatDisplayName = formatDisplayName;
module.exports.translatePhrase = translatePhrase;
module.exports.sendMessage = sendMessage;
module.exports.deleteMessage = deleteMessage;
module.exports.resolveMessage = resolveMessage;
