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
    const {message, executor} = data;
    const member = message.member;

    const embed = new MessageEmbed();
    embed.setColor('YELLOW');

    const displayName = functions.formatDisplayName(member.user, member);
    embed.setFooter(util.format(functions.translatePhrase('log_message_delete', guild.db.language), displayName, `#${message.channel.name}`));

    if (executor) {
      const executorName = functions.formatDisplayName(executor.user, executor);
      embed.setFooter(util.format(functions.translatePhrase('log_message_delete_audit', guild.db.language), displayName, `#${message.channel.name}`, executorName));
    }

    let content = '';
    const files = [];

    if (message.cleanContent.length > 0) {
      if (functions.logLengthCheck(message.cleanContent)) content += util.format(functions.translatePhrase('log_message', guild.db.language), message.content);
      else {
        const u = v4();

        content += util.format(functions.translatePhrase('log_message_attachment', guild.db.language), u);
        files.push({attachment: Buffer.from(message.cleanContent, 'utf-8'), name: `${u}.txt`});
      }
    }

    if (message.attachments.size > 0) {
      const attachment = message.attachments.first();
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
    const {oldMessage, newMessage} = data;

    const embed = new MessageEmbed();
    embed.setColor('DARKER_GREY');

    const displayName = functions.formatDisplayName(newMessage.author, newMessage.member);
    embed.setFooter(util.format(functions.translatePhrase('log_message_edit', guild.db.language), displayName, `#${newMessage.channel.name}`));

    let content = '';
    const files = [];

    if (oldMessage.cleanContent.length > 0) {
      if (functions.logLengthCheck(oldMessage.cleanContent)) content += util.format(functions.translatePhrase('log_message', guild.db.language), oldMessage.content);
      else {
        const u = v4();

        content += util.format(functions.translatePhrase('log_message_attachment', guild.db.language), u);
        files.push({attachment: Buffer.from(oldMessage.cleanContent, 'utf-8'), name: `${u}.txt`});
      }
    }

    if (content.length > 0) content += '\n';

    if (newMessage.cleanContent.length > 0) {
      if (functions.logLengthCheck(newMessage.cleanContent)) content += util.format(functions.translatePhrase('log_message_new', guild.db.language), newMessage.url, newMessage.content);
      else {
        const u = v4();

        content += util.format(functions.translatePhrase('log_message_attachment_new', guild.db.language), newMessage.url, u);
        files.push({attachment: Buffer.from(newMessage.cleanContent, 'utf-8'), name: `${u}.txt`});
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
    const {channel, messages, members, executor} = data;

    const embed = new MessageEmbed();
    embed.setColor('YELLOW');

    let executorName = '';
    if (executor) executorName = functions.formatDisplayName(executor.user, executor);

    if (members.length === 1) {
      const displayName = functions.formatDisplayName(members[0].user, members[0]);
      embed.setFooter(util.format(functions.translatePhrase('log_message_bulk_specific', guild.db.language), messages.size, displayName, `#${channel.name}`));

      if (executor) embed.setFooter(util.format(functions.translatePhrase('log_message_bulk_specific_audit', guild.db.language), messages.size, displayName, `#${channel.name}`, executorName));
    } else {
      embed.setFooter(util.format(functions.translatePhrase('log_message_bulk', guild.db.language), messages.size, `#${channel.name}`));

      if (executor) embed.setFooter(util.format(functions.translatePhrase('log_message_bulk_audit', guild.db.language), messages.size, `#${channel.name}`, executorName));
    }

    const u = v4();
    const files = [{attachment: Buffer.from(functions.formatBulkMessages(messages), 'utf-8'), name: `${u}.txt`}];
    embed.setDescription(util.format(functions.translatePhrase('log_messages_attachment', guild.db.language), u));

    try {
      resolve(await push(guild, embed, files));
    } catch (err) {
      reject(err);
    }
  });
};

join = (guild, member) => {
  return new Promise(async (resolve, reject) => {
    const embed = new MessageEmbed();
    embed.setColor('BLURPLE');

    embed.setFooter(util.format(functions.translatePhrase('log_join', guild.db.language), member.user.tag, member.id));

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
    const {member, executor} = data;

    const embed = new MessageEmbed();
    embed.setColor('RED');

    const displayName = functions.formatDisplayName(member.user, member);
    const executorName = functions.formatDisplayName(executor.user, executor);
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
    const {member, executor, reason} = data;

    const embed = new MessageEmbed();
    embed.setColor('DARK_RED');

    const displayName = functions.formatDisplayName(member.user, member);
    embed.setFooter(util.format(functions.translatePhrase('log_ban', guild.db.language), displayName));

    if (executor) {
      const executorName = functions.formatDisplayName(executor.user, executor);
      embed.setFooter(util.format(functions.translatePhrase('log_ban_audit', guild.db.language), displayName, executorName));
    }

    let content = '';
    const files = [];

    if (reason) content += util.format(functions.translatePhrase('log_reason', guild.db.language), reason);

    if (member.user.messages && member.user.messages[guild.id]) {
      if (content.length > 0) content += '\n';
      const u = v4();

      files.push({attachment: Buffer.from(functions.formatBulkMessages(member.user.messages[guild.id], true), 'utf-8'), name: `${u}.txt`});
      embed.setDescription(util.format(functions.translatePhrase('log_messages_attachment', guild.db.language), u));
      delete member.user.messages[guild.id];
    }

    try {
      resolve(await push(guild, embed, files));
    } catch (err) {
      reject(err);
    }
  });
};

role = (guild, data) => {
  return new Promise(async (resolve, reject) => {
    const {member, role, executor} = data;

    const embed = new MessageEmbed();
    const displayName = functions.formatDisplayName(member.user, member);

    let executorName = '';
    if (executor) executorName = functions.formatDisplayName(executor.user, executor);

    if (role.$add) {
      embed.setFooter(util.format(functions.translatePhrase('log_role_add', guild.db.language), displayName, role.$add.name));
      if (executor) embed.setFooter(util.format(functions.translatePhrase('log_role_add_audit', guild.db.language), displayName, role.$add.name, executorName));
    } else {
      embed.setFooter(util.format(functions.translatePhrase('log_role_remove', guild.db.language), displayName, role.$remove.name));
      if (executor) embed.setFooter(util.format(functions.translatePhrase('log_role_remove_audit', guild.db.language), displayName, role.$remove.name, executorName));
    }

    try {
      resolve(await push(guild, embed));
    } catch (err) {
      reject(err);
    }
  });
};

username = (guild, data) => {
  return new Promise(async (resolve, reject) => {
    const {member, oldUser} = data;

    const embed = new MessageEmbed();

    let displayName = oldUser.tag;
    if (member.displayName !== member.user.username) displayName += ` [${member.displayName}]`;
    embed.setFooter(util.format(functions.translatePhrase('log_username', guild.db.language), displayName, member.user.tag));

    try {
      resolve(await push(guild, embed));
    } catch (err) {
      reject(err);
    }
  });
};

nickname = (guild, data) => {
  return new Promise(async (resolve, reject) => {
    const {oldMember, newMember, executor} = data;

    const embed = new MessageEmbed();
    const displayName = functions.formatDisplayName(oldMember.user, oldMember);

    if (!executor) {
      if (oldMember.user.username === oldMember.displayName) embed.setFooter(util.format(functions.translatePhrase('log_nickname_new', guild.db.language), displayName, newMember.displayName));
      else if (newMember.user.username === newMember.displayName) embed.setFooter(util.format(functions.translatePhrase('log_nickname_delete', guild.db.language), displayName));
      else embed.setFooter(util.format(functions.translatePhrase('log_nickname', guild.db.language), displayName, newMember.displayName));
    } else {
      const executorName = functions.formatDisplayName(executor.user, executor);

      if (oldMember.user.username === oldMember.displayName) embed.setFooter(util.format(functions.translatePhrase('log_nickname_new_audit', guild.db.language), executorName, displayName, newMember.displayName));
      else if (newMember.user.username === newMember.displayName) embed.setFooter(util.format(functions.translatePhrase('log_nickname_delete_audit', guild.db.language), executorName, displayName));
      else embed.setFooter(util.format(functions.translatePhrase('log_nickname_audit', guild.db.language), executorName, displayName, newMember.displayName));
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
    if (!channel || !channel.permissionsFor(guild.me).has(['SEND_MESSAGES', 'EMBED_LINKS'])) return resolve();

    try {
      resolve(await channel.send({embed, files}));
    } catch (err) {
      reject(err);
    }
  });
};

module.exports.Type = Type;
