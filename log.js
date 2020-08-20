const functions = require('./functions.js');
const helper = require('./helper.js');
const { MessageEmbed } = require('discord.js');
const util = require('util');
const { uuid } = require('uuidv4');

const Type = {
  MESSAGE_DELETE: 'message_delete',
  MESSAGE_UPDATE: 'message_update',
  MESSAGE_BULK_DELETE: 'message_bulk_delete',
  JOIN: 'join',
  LEAVE: 'leave',
  BAN: 'ban',
  KICK: 'kick',
}

module.exports.Type = Type;

module.exports.send = function(guild, data, type) {
  return new Promise(async (resolve, reject) => {
    if (!guild.hasOwnProperty('ready') || guild.db.log.channel == null) return resolve();
    if (!guild.db.log.enabledModules.includes(type)) return resolve();

    try {
      switch (type) {
        case Type.MESSAGE_DELETE: return resolve(await logDelete(guild, data));
        case Type.MESSAGE_UPDATE: return resolve(await logUpdate(guild, data));
        case Type.MESSAGE_BULK_DELETE: return resolve(await logBulkDelete(guild, data));
        case Type.JOIN: return resolve(await logJoin(guild, data));
        case Type.LEAVE: return resolve(await logLeave(guild, data));
        case Type.BAN: return resolve(await logBan(guild, data));
        case Type.KICK: return resolve(await logKick(guild, data));
      }
    } catch (e) { reject(e); }
  })
}

function logDelete(guild, data) {
  return new Promise(async (resolve, reject) => {
    let member = data.message.member;

    let embed = new MessageEmbed();
    embed.setColor('YELLOW');

    let displayName = member.user.tag;
    if (member.user.username != member.displayName) displayName += ` [${data.message.member.displayName}]`;
    embed.setFooter(util.format(helper.translatePhrase('log_message_delete', guild.db.lang), displayName, `#${data.message.channel.name}`));

    if (data.executor) {
      let executorName = data.executor.user.tag;
      if (data.executor.user.username != data.executor.displayName) executorName += ` [${data.executor.displayName}]`;
      embed.setFooter(util.format(helper.translatePhrase('log_message_delete_audit', guild.db.lang), displayName, `#${data.message.channel.name}`, executorName));
    }

    let content = '';
    let files = [];

    if (data.message.cleanContent.length > 0) {
      if (functions.logLengthCheck(data.message.cleanContent)) content += util.format(helper.translatePhrase('log_message', guild.db.lang), data.message.content);
      else {
        let u = uuid();

        content += util.format(helper.translatePhrase('log_message_attachment', guild.db.lang), u);
        files.push({ attachment: Buffer.from(data.message.cleanContent, 'utf-8'), name: `${u}.txt`})
      }
    }

    if (data.message.attachments.size > 0) {
      let attachment = data.message.attachments.first();

      if (attachment.link) {
        if (content.length > 0) content += '\n';

        if (guild.db.log.files != null) content += util.format(helper.translatePhrase('log_attachment_url', guild.db.lang), attachment.link.url, attachment.name);
        else content += util.format(helper.translatePhrase('log_attachment_configure', guild.db.lang), attachment.name, guild.db.prefix);
      }
    }

    embed.setDescription(content);
    try { return resolve(await send(guild, embed, files)); }
    catch (e) { reject(e); }
  })
}

function logUpdate(guild, data) {
  return new Promise(async (resolve, reject) => {
    let embed = new MessageEmbed();
    embed.setColor('DARKER_GREY');

    let displayName = data.new.author.tag;
    if (data.new.author.username != data.new.member.displayName) displayName += ` [${data.new.member.displayName}]`;
    embed.setFooter(util.format(helper.translatePhrase('log_message_edit', guild.db.lang), displayName, `#${data.new.channel.name}`));

    let content = '';
    let files = [];

    if (data.old.cleanContent.length > 0) {
      if (functions.logLengthCheck(data.old.cleanContent)) content += util.format(helper.translatePhrase('log_message', guild.db.lang), data.old.content);
      else {
        let u = uuid();
        content += util.format(helper.translatePhrase('log_message_attachment', guild.db.lang), u);
        files.push({ attachment: Buffer.from(data.old.cleanContent, 'utf-8'), name: `${u}.txt`})
      }
    }

    if (content.length > 0) content += '\n';

    if (data.new.cleanContent.length > 0) {
      if (functions.logLengthCheck(data.new.cleanContent)) content += util.format(helper.translatePhrase('log_message_new', guild.db.lang), data.new.url, data.new.content);
      else {
        let u = uuid();
        content += util.format(helper.translatePhrase('log_message_attachment_new', guild.db.lang), data.new.url, u);
        files.push({ attachment: Buffer.from(data.new.cleanContent, 'utf-8'), name: `${u}.txt`})
      }
    }

    embed.setDescription(content);
    try { return resolve(await send(guild, embed, files)); }
    catch (e) { reject(e); }
  })
}

function logBulkDelete(guild, data) {
  return new Promise(async (resolve, reject) => {
    let embed = new MessageEmbed();
    embed.setColor('YELLOW');
    embed.setFooter(util.format(helper.translatePhrase('log_message_bulk', guild.db.lang), data.messages.length, `#${data.channel.name}`));

    let string = '';
    let files = [];

    for (let i = data.messages.length - 1; i >= 0; i--) {
      let message = data.messages[i];
      
      let displayName = message.author.tag;
      if (message.author.username != message.member.displayName) displayName += ` [${message.member.displayName}]`;

      if (message.changes) {
        for (let x = 0; x < message.changes.length; x++) {
          let messageEdit = message.changes[x];

          if (messageEdit.length == 0) continue;
          if (string.length > 0) string += '\n';

          string += `${new Date(messageEdit.createdTimestamp)} ${displayName} | ${messageEdit.content}`;
        }
      }

      if (message.cleanContent.length > 0) {
        if (string.length > 0) string += '\n';
        string += `${new Date(message.createdTimestamp)} ${displayName} - ${message.content}`;
      }

      if (message.attachments.size > 0) {
        let attachment = message.attachments.first();
        if (string.length > 0) string += '\n';
        if (attachment.link) string += util.format(helper.translatePhrase('log_messages_bulk_attachment', guild.db.lang), attachment.link.url);
      }
    }

    let u = uuid();
    let content = util.format(helper.translatePhrase('log_messages_attachment', guild.db.lang), u);
    files.push({ attachment: Buffer.from(string, 'utf-8'), name: `${u}.txt`});

    embed.setDescription(content);
    try { return resolve(await send(guild, embed, files)); }
    catch (e) { reject(e); }
  })
}

function logJoin(guild, member) {
  return new Promise(async (resolve, reject) => {
    let embed = new MessageEmbed();
    embed.setColor('BLURPLE');
    embed.setDescription(util.format(helper.translatePhrase('log_join', guild.db.lang), `<@${member.id}>`, member.user.tag, member.id));

    try { return resolve(await send(guild, embed)); }
    catch (e) { reject(e); }
  })
}

function logLeave(guild, member) {
  return new Promise(async (resolve, reject) => {
    let embed = new MessageEmbed();
    embed.setColor('BLURPLE');

    let displayName = member.user.tag;
    if (member.user.username != member.displayName) displayName += ` [${member.displayName}]`;
    embed.setDescription(util.format(helper.translatePhrase('log_leave', guild.db.lang), `<@${member.id}>`, displayName, member.id));

    try { return resolve(await send(guild, embed)); }
    catch (e) { reject(e); }
  })
}

function logBan(guild, data) {
  return new Promise(async (resolve, reject) => {
    let member = data.member;
    let executor = data.executor;

    let embed = new MessageEmbed();
    embed.setColor('DARK_RED');

    let displayName = member.user.tag;
    if (member.user.username != member.displayName) displayName += ` [${member.displayName}]`;

    let executorName = executor.user.tag;
    if (executor.user.username != executor.displayName) executorName += ` [${executor.displayName}]`;
    embed.setFooter(util.format(helper.translatePhrase('log_executor', guild.db.lang), executorName));
    
    let content = util.format(helper.translatePhrase('log_ban', guild.db.lang), `<@${member.id}>`, displayName, member.id);
    let files = [];

    if (data.reason) {
      content += '\n';

      if (functions.logLengthCheck(data.reason)) content += util.format(helper.translatePhrase('log_reason', guild.db.lang), data.reason);
      else {
        let u = uuid();
        content += util.format(helper.translatePhrase('log_reason_attachment', guild.db.lang), data.reason, u);
        files.push({ attachment: Buffer.from(data.reason, 'utf-8'), name: `${u}.txt`})
      }
    }

    embed.setDescription(content);
    try { return resolve(await send(guild, embed, files)); }
    catch (e) { reject(e); }
  })
}

function logKick(guild, data) {
  return new Promise(async (resolve, reject) => {
    let member = data.member;
    let executor = data.executor;
    
    let embed = new MessageEmbed();
    embed.setColor('RED');

    let displayName = member.user.tag;
    if (member.user.username != member.displayName) displayName += ` [${member.displayName}]`;

    let executorName = executor.user.tag;
    if (executor.user.username != executor.displayName) executorName += ` [${executor.displayName}]`;
    embed.setFooter(util.format(helper.translatePhrase('log_executor', guild.db.lang), executorName));

    let content = util.format(helper.translatePhrase('log_kick', guild.db.lang), `<@${member.id}>`, displayName, member.id);
    let files = [];

    if (data.reason) {
      content += '\n';

      if (functions.logLengthCheck(data.reason)) content += util.format(helper.translatePhrase('log_reason', guild.db.lang), data.reason);
      else {
        let u = uuid();
        content += util.format(helper.translatePhrase('log_reason_attachment', guild.db.lang), data.reason, u);
        files.push({ attachment: Buffer.from(data.reason, 'utf-8'), name: `${u}.txt`})
      }
    }

    embed.setDescription(content);
    try { return resolve(await send(guild, embed)); }
    catch (e) { reject(e); }
  })
}

function send(guild, embed, files) {
  return new Promise(async (resolve, reject) => {
    if (guild.hasOwnProperty('logHook')) {
      try { return resolve(await guild.logHook.send('', { embeds: [ embed ], files: files })); }
      catch { }
    }

    let guildChannel = guild.channels.cache.find(channel => channel.id == guild.db.log.channel);
    try { resolve(await guildChannel.send('', { embed: embed, files: files })); }
    catch (e) { reject(e); }
  })
}