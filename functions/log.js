const functions = require('./functions.js');
const sql = require('./sql.js');

const util = require('util');
const { uuid } = require('uuidv4');
const { MessageEmbed } = require('discord.js');

const Type = {
  MESSAGE_DELETE: 'message_delete',
  MESSAGE_UPDATE: 'message_update',
  MESSAGE_BULK_DELETE: 'message_bulk_delete',
  JOIN: 'join',
  LEAVE: 'leave',
  KICK: 'kick',
  BAN: 'ban'
}

module.exports.send = function(guild, data, type) {
  return new Promise(async (resolve, reject) => {
    if (!guild.ready || guild.db.logs.channel == null) return resolve();
    if (!guild.db.enabledModules.includes(type)) return resolve();

    try {
      switch (type) {
        case Type.MESSAGE_DELETE: return resolve(await del(guild, data));
        case Type.MESSAGE_UPDATE: return resolve(await update(guild, data));
        case Type.MESSAGE_BULK_DELETE: return resolve(await bulk(guild, data));
        case Type.JOIN: return resolve(await join(guild, data));
        case Type.LEAVE: return resolve(await leave(guild, data));
        case Type.KICK: return resolve(await kick(guild, data));
        case Type.BAN: return resolve(await ban(guild, data));
      }
    } catch (e) { reject(e); }
  })
}

function del(guild, data) {
  return new Promise(async (resolve, reject) => {
    let member = data.message.member;

    let embed = new MessageEmbed();
    embed.setColor('YELLOW');

    let displayName = functions.formatDisplayName(member.user, member);
    embed.setFooter(util.format(functions.translatePhrase('log_message_delete', guild.db.lang), displayName, `#${data.message.channel.name}`));

    if (data.executor) {
      let executorName = functions.formatDisplayName(data.executor.user, data.executor);
      embed.setFooter(util.format(functions.translatePhrase('log_message_delete_audit', guild.db.lang), displayName, `#${data.message.channel.name}`, executorName));
    }

    let content = '';
    let files = [];

    if (data.message.cleanContent.length > 0) {
      if (functions.logLengthCheck(data.message.cleanContent)) content += util.format(functions.translatePhrase('log_message', guild.db.lang), data.message.content);
      else {
        let u = uuid();

        content += util.format(functions.translatePhrase('log_message_attachment', guild.db.lang), u);
        files.push({ attachment: Buffer.from(data.message.cleanContent, 'utf-8'), name: `${u}.txt`})
      }
    }

    if (data.message.attachments.size > 0) {
      let attachment = data.message.attachments.first();
      if (attachment.downloading && !attachment.link) return resolve(attachment.late = { guild: guild, data: data });

      if (content.length > 0) content += '\n';
      if (attachment.link) content += util.format(functions.translatePhrase('log_attachment_url', guild.db.lang), attachment.link.url, attachment.name);
      else if (!guild.db.files.channel) content += util.format(functions.translatePhrase('log_attachment_configure', guild.db.lang), attachment.name, guild.db.prefix);
      else content += util.format(functions.translatePhrase('log_attachment', guild.db.lang), attachment.name);
    }

    embed.setDescription(content);
    try { resolve(await send(guild, embed, files));
    } catch (e) { reject(e); }
  })
}

function update(guild, data) {
  return new Promise(async (resolve, reject) => {
    let embed = new MessageEmbed();
    embed.setColor('DARKER_GREY');

    let displayName = functions.formatDisplayName(data.new.author, data.new.member);
    embed.setFooter(util.format(functions.translatePhrase('log_message_edit', guild.db.lang), displayName, `#${data.new.channel.name}`));

    let content = '';
    let files = [];

    if (data.old.cleanContent.length > 0) {
      if (functions.logLengthCheck(data.old.cleanContent)) content += util.format(functions.translatePhrase('log_message', guild.db.lang), data.old.content);
      else {
        let u = uuid();
        content += util.format(functions.translatePhrase('log_message_attachment', guild.db.lang), u);
        files.push({ attachment: Buffer.from(data.old.cleanContent, 'utf-8'), name: `${u}.txt`})
      }
    }

    if (content.length > 0) content += '\n';

    if (data.new.cleanContent.length > 0) {
      if (functions.logLengthCheck(data.new.cleanContent)) content += util.format(functions.translatePhrase('log_message_new', guild.db.lang), data.new.url, data.new.content);
      else {
        let u = uuid();
        content += util.format(functions.translatePhrase('log_message_attachment_new', guild.db.lang), data.new.url, u);
        files.push({ attachment: Buffer.from(data.new.cleanContent, 'utf-8'), name: `${u}.txt`})
      }
    }

    embed.setDescription(content);
    try { resolve(await send(guild, embed, files));
    } catch (e) { reject(e); }
  })
}

function bulk(guild, data) {
  return new Promise(async (resolve, reject) => {
    let embed = new MessageEmbed();
    embed.setColor('YELLOW');
    embed.setFooter(util.format(functions.translatePhrase('log_message_bulk', guild.db.lang), data.messages.length, `#${data.channel.name}`));

    let string = '';
    let files = [];

    for (let i = 0; i < data.messages.length; i++) {
      let message = data.messages[i];
      let displayName = functions.formatDisplayName(message.author, message.member);

      if (message.changes) {
        for (let x = 0; x < message.changes.length; x++) {
          let messageEdit = message.changes[x];

          if (messageEdit.length == 0) continue;
          if (string.length > 0) string += '\n';

          string += `${new Date(messageEdit.createdTimestamp)} ${displayName} - ${messageEdit.content}`;
        }
      }

      if (message.cleanContent.length > 0) {
        if (string.length > 0) string += '\n';
        string += `${new Date(message.createdTimestamp)} ${displayName} > ${message.content}`;
      }

      if (message.attachments.size > 0) {
        let attachment = message.attachments.first();
        if (string.length > 0) string += '\n';
        if (attachment.link) string += util.format(functions.translatePhrase('log_messages_bulk_attachment', guild.db.lang), attachment.link.url);
      }
    }

    let u = uuid();
    let content = util.format(functions.translatePhrase('log_messages_attachment', guild.db.lang), u);
    files.push({ attachment: Buffer.from(string, 'utf-8'), name: `${u}.txt`});

    embed.setDescription(content);
    try { resolve(await send(guild, embed, files));
    } catch (e) { reject(e); }
  })
}

function join(guild, member) {
  return new Promise(async (resolve, reject) => {
    let embed = new MessageEmbed();
    embed.setColor('BLURPLE');
    embed.setDescription(util.format(functions.translatePhrase('log_join', guild.db.lang), `<@${member.id}>`, member.user.tag, member.id));

    let infractions = 0;
    try { 
      let query = await sql.findInfractions(guild.id, { member: member.id });
      infractions = query.length;
    } catch { }

    embed.setFooter(util.format(functions.translatePhrase('log_infractions', guild.db.lang), infractions));
    try { resolve(await send(guild, embed));
    } catch (e) { reject(e); }
  })
}

function leave(guild, member) {
  return new Promise(async (resolve, reject) => {
    let embed = new MessageEmbed();
    embed.setColor('BLURPLE');

    let displayName = functions.formatDisplayName(member.user, member);
    embed.setDescription(util.format(functions.translatePhrase('log_leave', guild.db.lang), `<@${member.id}>`, displayName, member.id));

    try { resolve(await send(guild, embed));
    } catch (e) { reject(e); }
  })
}

function kick(guild, data) {
  return new Promise(async (resolve, reject) => {
    let embed = new MessageEmbed();
    embed.setColor('RED');

    let member = data.member;
    let executor = data.executor;

    let displayName = functions.formatDisplayName(member.user, member);
    let executorName = functions.formatDisplayName(executor.user, executor);

    content = util.format(functions.translatePhrase('log_kick', guild.db.lang), `<@${member.id}>`, displayName, member.id);
    if (data.reason) content += `\n${util.format(functions.translatePhrase('log_reason', guild.db.lang), data.reason)}`;

    embed.setDescription(content);
    embed.setFooter(util.format(functions.translatePhrase('log_footer', guild.db.lang), executorName));

    try { resolve(await send(guild, embed));
    } catch (e) { reject(e); }
  })
}

function ban(guild, data) {
  return new Promise(async (resolve, reject) => {
    let embed = new MessageEmbed();
    embed.setColor('DARK_RED');

    let member = data.member;
    let executor = data.executor;

    let displayName = functions.formatDisplayName(member.user, member);
    let executorName = functions.formatDisplayName(executor.user, executor);

    content = util.format(functions.translatePhrase('log_ban', guild.db.lang), `<@${member.id}>`, displayName, member.id);
    if (data.reason) content += `\n${util.format(functions.translatePhrase('log_reason', guild.db.lang), data.reason)}`;

    embed.setDescription(content);
    embed.setFooter(util.format(functions.translatePhrase('log_footer', guild.db.lang), executorName));

    try { resolve(await send(guild, embed));
    } catch (e) { reject(e); }
  })
}

function send(guild, embed, files) {
  return new Promise(async (resolve, reject) => {
    if (guild.hook.logs) {
      try { return resolve(await guild.hook.logs.send({ embeds: [ embed ], files: files }));
      } catch { }
    }

    let guildChannel = guild.channels.resolve(guild.db.logs.channel);
    if (!guildChannel) return resolve(null);

    try { resolve(await guildChannel.send({ embed: embed, files: files }));
    } catch (e) { reject(e); }
  })
}

module.exports.Type = Type;