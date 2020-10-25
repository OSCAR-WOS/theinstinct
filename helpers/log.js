const functions = require('./functions.js');

const util = require('util');
const {v4} = require('uuid');
const {MessageEmbed} = require('discord.js');

const Type = {
  MESSAGE_DELETE: 'message_delete',
  MESSAGE_UPDATE: 'message_update',
  MESSAGE_BULK_DELETE: 'message_bulk_delete',
  JOIN: 'join',
  LEAVE: 'leave',
  KICK: 'kick',
  BAN: 'ban',
  ROLE_ADD: 'role_add',
  ROLE_REMOVE: 'role_remove',
  MUTE_ADD: 'mute_add',
  PUNISH_ADD: 'punish_add',
  GAG_ADD: 'gag_add',
  MUTE_REMOVE: 'mute_remove',
  PUNISH_REMOVE: 'punish_remove',
  GAG_REMOVE: 'gag_remove',
  USERNAME_UPDATE: 'username_update',
  NICKNAME_UPDATE: 'nickname_update',
};

module.exports.send = (guild, type, data) => {
  return new Promise(async (resolve, reject) => {
    if (!guild.ready || !guild.db.logs.channel) return resolve();
    if (!guild.db.enabledLogs.includes(type)) return resolve();

    try {
      switch (type) {
        case Type.MESSAGE_DELETE: return resolve(await del(guild, data));
        case Type.MESSAGE_UPDATE: return resolve(await update(guild, data));
        case Type.MESSAGE_BULK_DELETE: return resolve(await bulk(guild, data));
        case Type.JOIN: return resolve(await join(guild, data));
        case Type.LEAVE: return resolve(await leave(guild, data));
        case Type.KICK: return resolve(await kick(guild, data));
        case Type.BAN: return resolve(await ban(guild, data));
        case Type.ROLE_ADD: case Type.ROLE_REMOVE: {
          return resolve(await role(guild, data));
        } case Type.MUTE_ADD: case Type.PUNISH_ADD: case Type.GAG_ADD: case Type.MUTE_REMOVE: case Type.PUNISH_REMOVE: case Type.GAG_REMOVE: {
          return resolve(await timedRole(guild, type, data));
        }
        case Type.USERNAME_UPDATE: return resolve(await username(guild, data));
        case Type.NICKNAME_UPDATE: return resolve(await nickname(guild, data));
      }
    } catch (err) {
      reject(err);
    }
  });
};

del = (guild, data) => {
  return new Promise(async (resolve, reject) => {
    const member = data.message.member;

    const embed = new MessageEmbed();
    embed.setColor('YELLOW');

    const displayName = functions.formatDisplayName(member.user, member);
    embed.setFooter(util.format(functions.translatePhrase('log_message_delete', guild.db.language), displayName, `#${data.message.channel.name}`));

    if (data.executor) embed.setFooter(util.format(functions.translatePhrase('log_message_delete_audit', guild.db.language), displayName, `#${data.message.channel.name}`, functions.formatDisplayName(data.executor.user, data.executor)));

    let content = '';
    const files = [];

    if (data.message.cleanContent.length > 0) {
      if (functions.logLengthCheck(data.message.cleanContent)) content += util.format(functions.translatePhrase('log_message', guild.db.language), data.message.content);
      else {
        const u = v4();

        content += util.format(functions.translatePhrase('log_message_attachment', guild.db.language), u);
        files.push({attachment: Buffer.from(data.message.cleanContent, 'utf-8'), name: `${u}.txt`});
      }
    }

    if (data.message.attachments.size > 0) {
      const attachment = data.message.attachments.first();
      if (attachment.downloading && !attachment.link) return resolve(attachment.late = {guild, data});

      if (content.length > 0) content += '\n';
      if (attachment.link) content += util.format(functions.translatePhrase('log_attachment_url', guild.db.language), attachment.link, attachment.name);
      else if (!guild.db.files.channel) content += util.format(functions.translatePhrase('log_attachment_configure', guild.db.language), attachment.name, guild.db.prefix);
      else content += util.format(functions.translatePhrase('log_attachment', guild.db.language), attachment.name);
    }

    embed.setDescription(content);

    try {
      resolve(await push(guild, embed, files));
    } catch (err) {
      reject(err);
    }
  });
};

update = (guild, data) => {
  return new Promise(async (resolve, reject) => {
    const embed = new MessageEmbed();
    embed.setColor('DARKER_GREY');

    const displayName = functions.formatDisplayName(data.newMessage.author, data.newMessage.member);
    embed.setFooter(util.format(functions.translatePhrase('log_message_edit', guild.db.language), displayName, `#${data.newMessage.channel.name}`));

    let content = '';
    const files = [];

    if (data.oldMessage.cleanContent.length > 0) {
      if (functions.logLengthCheck(data.oldMessage.cleanContent)) content += util.format(functions.translatePhrase('log_message', guild.db.language), data.oldMessage.content);
      else {
        const u = v4();

        content += util.format(functions.translatePhrase('log_message_attachment', guild.db.language), u);
        files.push({attachment: Buffer.from(data.oldMessage.cleanContent, 'utf-8'), name: `${u}.txt`});
      }
    }

    if (content.length > 0) content += '\n';

    if (data.newMessage.cleanContent.length > 0) {
      if (functions.logLengthCheck(data.newMessage.cleanContent)) content += util.format(functions.translatePhrase('log_message_new', guild.db.language), data.newMessage.url, data.newMessage.content);
      else {
        const u = v4();

        content += util.format(functions.translatePhrase('log_message_attachment_new', guild.db.language), data.newMessage.url, u);
        files.push({attachment: Buffer.from(data.newMessage.cleanContent, 'utf-8'), name: `${u}.txt`});
      }
    }

    embed.setDescription(content);

    try {
      resolve(await push(guild, embed, files));
    } catch (err) {
      reject(err);
    }
  });
};

bulk = (guild, data) => {
  return new Promise(async (resolve, reject) => {
    const embed = new MessageEmbed();
    embed.setColor('YELLOW');

    embed.setFooter(util.format(functions.translatePhrase('log_message_bulk', guild.db.language), data.messages.size, `#${data.channel.name}`));
    if (data.executor) embed.setFooter(util.format(functions.translatePhrase('log_message_bulk_audit', guild.db.language), data.messages.size, `#${data.channel.name}`, functions.formatDisplayName(data.executor.user, data.executor)));

    let string = '';
    const files = [];

    data.messages.forEach((message) => {
      const displayName = functions.formatDisplayName(message.author, message.member);

      if (message.changes) {
        for (let i = 0; i < message.changes.length; i++) {
          const edit = message.changes[i];

          if (edit.length === 0) continue;
          if (stringify.length > 0) string += '\n';

          string += `${new Date(edit.createdTimestamp)} ${displayName} - ${edit.cleanContent}`;
        }
      }

      if (message.cleanContent.length > 0) {
        if (string.length > 0) string += '\n';
        string += `${new Date(message.createdTimestamp)} ${displayName} > ${message.content}`;
      }

      if (message.attachments.size > 0) {
        const attachment = message.attachments.first();

        if (string.length > 0) string += '\n';
        if (attachment.link) string += util.format(functions.translatePhrase('log_messages_bulk_attachment', guild.db.language), attachment.link);
      }
    });

    const u = v4();
    files.push({attachment: Buffer.from(string, 'utf-8'), name: `${u}.txt`});
    embed.setDescription(util.format(functions.translatePhrase('log_messages_attachment', guild.db.lang), u));

    try {
      resolve(await push(guild, embed, files));
    } catch (err) {
      reject(err);
    }
  });
};

join = (guild, data) => {
  return new Promise(async (resolve, reject) => {
    const embed = new MessageEmbed();
    embed.setColor('BLURPLE');
    embed.setFooter(util.format(functions.translatePhrase('log_join', guild.db.language), data.member.user.tag, data.infractions));

    try {
      resolve(await push(guild, embed));
    } catch (err) {
      reject(err);
    }
  });
};

leave = (guild, member) => {
  return new Promise(async (resolve, reject) => {
    const embed = new MessageEmbed();
    embed.setColor('BLURPLE');

    const displayName = functions.formatDisplayName(member.user, member);
    embed.setFooter(util.format(functions.translatePhrase('log_leave', guild.db.language), displayName, member.id));

    try {
      resolve(await push(guild, embed));
    } catch (err) {
      reject(err);
    }
  });
};

kick = (guild, data) => {
  return new Promise(async (resolve, reject) => {
    const embed = new MessageEmbed();
    embed.setColor('RED');

    const displayName = functions.formatDisplayName(data.member.user, data.member);
    const executorName = functions.formatDisplayName(data.executor.user, data.executor);
    embed.setFooter(util.format(functions.translatePhrase('log_kick', guild.db.language), displayName, executorName));

    try {
      resolve(await push(guild, embed));
    } catch (err) {
      reject(err);
    }
  });
};

ban = (guild, data) => {
  return new Promise(async (resolve, reject) => {
    const embed = new MessageEmbed();
    embed.setColor('DARK_RED');

    const displayName = functions.formatDisplayName(data.member.user, data.member);
    embed.setFooter(util.format(functions.translatePhrase('log_ban', guild.db.language), displayName));

    if (data.executor) embed.setFooter(util.format(functions.translatePhrase('log_ban_audit', guild.db.language), displayName, functions.formatDisplayName(data.executor.user, data.executor)));

    try {
      resolve(await push(guild, embed));
    } catch (err) {
      reject(err);
    }
  });
};

role = (guild, data) => {
  return new Promise(async (resolve, reject) => {
    const embed = new MessageEmbed();
    embed.setColor('WHITE');

    const displayName = functions.formatDisplayName(data.member.user, data.member);

    if (data.role.$add) {
      if (data.executor) embed.setFooter(util.format(functions.translatePhrase('log_role_add_audit', guild.db.language), displayName, data.role.$add.name, functions.formatDisplayName(data.executor.user, data.executor)));
      else embed.setFooter(util.format(functions.translatePhrase('log_role_add', guild.db.language), displayName, data.role.$add.name));
    } else {
      if (data.executor) embed.setFooter(util.format(functions.translatePhrase('log_role_remove_audit', guild.db.language), displayName, data.role.$remove.name, functions.formatDisplayName(data.executor.user, data.executor)));
      else embed.setFooter(util.format(functions.translatePhrase('log_role_remove', guild.db.language), displayName, data.role.$remove.name));
    }

    try {
      resolve(await push(guild, embed));
    } catch (err) {
      reject(err);
    }
  });
};

timedRole = (guild, type, data) => {
  return new Promise(async (resolve, reject) => {
    const embed = new MessageEmbed();
    embed.setColor('ORANGE');

    const displayName = functions.formatDisplayName(data.member.user, data.member);
    let translation = '';

    switch (type) {
      case Type.MUTE_ADD: translation = 'log_mute_add'; break;
      case Type.PUNISH_ADD: translation = 'log_punish_add'; break;
      case Type.GAG_ADD: translation = 'log_gag_add'; break;
      case Type.MUTE_REMOVE: translation = 'log_mute_remove'; break;
      case Type.PUNISH_REMOVE: translation = 'log_punish_remove'; break;
      case Type.GAG_REMOVE: translation = 'log_gag_remove'; break;
    }

    let content = '';
    if (!data.executor) content = util.format(functions.translatePhrase(translation, guild.db.language), displayName);
    else {
      translation += '_audit';
      content = util.format(functions.translatePhrase(translation, guild.db.language), displayName, functions.formatDisplayName(data.executor.user, data.executor));
    }

    embed.setFooter(content);

    try {
      resolve(await push(guild, embed));
    } catch (err) {
      reject(err);
    }
  });
};

username = (guild, data) => {
  return new Promise(async (resolve, reject) => {
    const embed = new MessageEmbed();

    const displayName = functions.formatDisplayName(data.oldMember.user, data.oldMember);
    embed.setFooter(util.format(functions.translatePhrase('log_username', guild.db.language), displayName, data.newMessage.user.tag));

    try {
      resolve(await push(guild, embed));
    } catch (err) {
      reject(err);
    }
  });
};

nickname = (guild, data) => {
  return new Promise(async (resolve, reject) => {
    const embed = new MessageEmbed();
    const displayName = functions.formatDisplayName(data.oldMember.user, data.oldMember);

    if (data.oldMember.user.username === data.oldMember.displayName) embed.setFooter(util.format(functions.translatePhrase('log_nickname_new', guild.db.language), displayName, data.newMember.displayName));
    else if (data.newMember.user.username === data.newMember.displayName) embed.setFooter(util.format(functions.translatePhrase('log_nickname_delete', guild.db.language), displayName));
    else embed.setFooter(util.format(functions.translatePhrase('log_nickname', guild.db.language), displayName, data.newMember.displayName));

    if (data.executor) {
      const executorName = functions.formatDisplayName(data.executor.user, data.executor);

      if (data.oldMember.user.username === data.oldMember.displayName) embed.setFooter(util.format(functions.translatePhrase('log_nickname_new_audit', guild.db.language), executorName, displayName, data.newMember.displayName));
      else if (data.newMember.user.username === data.newMember.displayName) embed.setFooter(util.format(functions.translatePhrase('log_nickname_delete_audit', guild.db.language), executorName, displayName));
      else embed.setFooter(util.format(functions.translatePhrase('log_nickname_audit', guild.db.language), executorName, displayName, data.newMember.displayName));
    }

    try {
      resolve(await push(guild, embed));
    } catch (err) {
      reject(err);
    }
  });
};

push = (guild, embed, files) => {
  return new Promise(async (resolve, reject) => {
    if (guild.hook.logs) {
      try {
        return resolve(await guild.hook.logs.send({embeds: [embed], files}));
      } catch { }
    }

    const channel = guild.channels.resolve(guild.db.logs.channel);
    if (!channel || !channel.permissionsFor(guild.me).has(['SEND_MESSAGES', 'EMBED_LINKS'])) return resolve(null);

    try {
      resolve(await channel.send({embed, files}));
    } catch (err) {
      reject(err);
    }
  });
};

module.exports.Type = Type;
