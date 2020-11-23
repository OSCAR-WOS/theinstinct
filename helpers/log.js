const constants = require('./constants.js');
const functions = require('./functions.js');

const util = require('util');
const {v4} = require('uuid');
const {MessageEmbed} = require('discord.js');

exports.send = (guild, type, data) => {
  return new Promise(async (resolve, reject) => {
    console.log(type);
    console.log(guild.db);
    if (!guild.ready || !guild.db.logs.detailed[type].enabled) return resolve();

    let {channel} = guild.db.logs;
    let webhook = guild.hooks.logs;

    if (guild.db.logs.setting === constants.LogSetting.SIMPLE) {
      if (!guild.db.logs.enabled) return resolve();
    } else {
      if (guild.db.logs.detailed[type].channel) {
        channel = guild.db.logs.detailed[type].channel;
        webhook = guild.hooks.detailed[type];
      }
    }

    try {
      switch (type) {
        case constants.Log.MESSAGE_DELETE: return resolve(await del(guild, {channel, webhook}, data));
        case constants.Log.MESSAGE_UPDATE: return resolve(await update(guild, {channel, webhook}, data));
        case constants.Log.MESSAGE_BULK_DELETE: return resolve(await bulk(guild, {channel, webhook}, data));
        case constants.Log.JOIN: return resolve(await join(guild, {channel, webhook}, data));
        case constants.Log.LEAVE: return resolve(await leave(guild, {channel, webhook}, data));
        case constants.Log.KICK: return resolve(await kick(guild, {channel, webhook}, data));
        case constants.Log.BAN: return resolve(await ban(guild, {channel, webhook}, data));
        case constants.Log.UNBAN: return resolve(await unban(guild, {channel, webhook}, data));
        case constants.Log.USERNAME_UPDATE: return resolve(await username(guild, {channel, webhook}, data));
        case constants.Log.NICKNAME_UPDATE: return resolve(await nickname(guild, {channel, webhook}, data));
        case constants.Log.ROLE_ADD: case constants.Log.ROLE_REMOVE: return resolve(await role(guild, {channel, webhook}, data));
      }
    } catch (err) {
      reject(err);
    }
  });
};

del = (guild, log, data) => {
  return new Promise(async (resolve, reject) => {
    const {message, executor} = data;
    const member = message.member;

    console.log(data);

    const embed = new MessageEmbed();
    embed.setColor('YELLOW');

    const displayName = functions.formatDisplayName(member.user, member);
    embed.setFooter(util.format(functions.translatePhrase('log_message_delete', guild.db.language), displayName, message.channel.name));

    if (executor) {
      const executorName = functions.formatDisplayName(executor.user, executor);
      embed.setFooter(util.format(functions.translatePhrase('log_message_delete_audit', guild.db.language), displayName, message.channel.name, executorName));
    }

    let content = '';
    const files = [];

    if (message.cleanContent.length > 0) {
      if (functions.logLengthCheck(message.cleanContent)) content += util.format(functions.translatePhrase('log_message', guild.db.language), message.content);
      else {
        const u = v4();

        content += util.format(functions.translatePhrase('log_message_attachment', guild.db.language), u);
        files.push({type: constants.AttachmentType.MESSAGE, attachment: Buffer.from(message.cleanContent, 'utf-8'), name: `${u}.txt`});
      }
    }

    for (const attachment of message.attachments.values()) {
      if (attachment.downloading && !attachment.link) return resolve(attachment.late = data);

      if (content.length > 0) content += '\n';
      if (attachment.link) content += util.format(functions.translatePhrase('log_attachment_url', guild.db.language), attachment.link, attachment.name);
      else if (!guild.db.files.channel) content += util.format(functions.translatePhrase('log_attachment_configure', guild.db.language), attachment.name);
      else if (!guild.db.files.enabled) content += util.format(functions.translatePhrase('log_attachment_disabled', guild.db.language), attachment.name);
      else if (attachment.error) content += util.format(functions.translatePhrase(attachment.error, guild.db.language), attachment.name);
      else content += util.format(functions.translatePhrase('log_attachment', guild.db.language), attachment.name);
    }

    embed.setDescription(content);

    try {
      resolve(push(guild, log, embed, {type: constants.Log.MESSAGE_DELETE, message, executor, attachments: message.attachments, embeds: message.embeds}, files));
    } catch (err) {
      reject(err);
    }
  });
};

update = (guild, log, data) => {
  return new Promise(async (resolve, reject) => {
    const {oldMessage, newMessage} = data;

    const embed = new MessageEmbed();
    embed.setColor('DARKER_GREY');

    const displayName = functions.formatDisplayName(newMessage.author, newMessage.member);
    embed.setFooter(util.format(functions.translatePhrase('log_message_edit', guild.db.language), displayName, newMessage.channel.name));

    let content = '';
    const files = [];

    if (oldMessage.cleanContent.length > 0) {
      if (functions.logLengthCheck(oldMessage.cleanContent)) content += util.format(functions.translatePhrase('log_message', guild.db.language), oldMessage.content);
      else {
        const u = v4();

        content += util.format(functions.translatePhrase('log_message_attachment', guild.db.language), u);
        files.push({type: constants.AttachmentType.OLD_MESSAGE, attachment: Buffer.from(oldMessage.cleanContent, 'utf-8'), name: `${u}.txt`});
      }
    }

    if (content.length > 0) content += '\n';

    if (newMessage.cleanContent.length > 0) {
      if (functions.logLengthCheck(newMessage.cleanContent)) content += util.format(functions.translatePhrase('log_message_new', guild.db.language), newMessage.url, newMessage.content);
      else {
        const u = v4();

        content += util.format(functions.translatePhrase('log_message_attachment_new', guild.db.language), newMessage.url, u);
        files.push({type: constants.AttachmentType.NEW_MESSAGE, attachment: Buffer.from(newMessage.cleanContent, 'utf-8'), name: `${u}.txt`});
      }
    }

    embed.setDescription(content);

    try {
      resolve(push(guild, log, embed, {type: constants.Log.MESSAGE_UPDATE, oldMessage, newMessage}, files));
    } catch (err) {
      reject(err);
    }
  });
};

bulk = (guild, log, data) => {
  return new Promise(async (resolve, reject) => {
    const {channel, messages, members, executor} = data;

    const embed = new MessageEmbed();
    embed.setColor('YELLOW');

    let executorName = '';
    if (executor) executorName = functions.formatDisplayName(executor.user, executor);

    if (members.length === 1) {
      const displayName = functions.formatDisplayName(members[0].user, members[0]);

      embed.setFooter(util.format(functions.translatePhrase('log_message_bulk_specific', guild.db.language), messages.size, displayName, channel.name));
      if (executor) embed.setFooter(util.format(functions.translatePhrase('log_message_bulk_specific_audit', guild.db.language), messages.size, displayName, channel.name, executorName));
    } else {
      embed.setFooter(util.format(functions.translatePhrase('log_message_bulk', guild.db.language), messages.size, channel.name));
      if (executor) embed.setFooter(util.format(functions.translatePhrase('log_message_bulk_audit', guild.db.language), messages.size, channel.name, executorName));
    }

    const u = v4();
    const files = [{type: constants.AttachmentType.MESSAGES, attachment: Buffer.from(functions.formatBulkMessages(messages), 'utf-8'), name: `${u}.txt`}];
    embed.setDescription(util.format(functions.translatePhrase('log_messages_attachment', guild.db.language), u));

    try {
      resolve(push(guild, log, embed, {type: constants.Log.MESSAGE_BULK_DELETE, channel, messages, members, executor}, files));
    } catch (err) {
      reject(err);
    }
  });
};

join = (guild, log, data) => {
  return new Promise(async (resolve, reject) => {
    const {member} = data;

    const embed = new MessageEmbed();
    embed.setColor('BLURPLE');

    const displayName = functions.formatDisplayName(member.user, member);
    embed.setFooter(util.format(functions.translatePhrase('log_join', guild.db.language), displayName, member.id));

    try {
      resolve(push(guild, log, embed, {type: constants.Log.JOIN, member}));
    } catch (err) {
      reject(err);
    }
  });
};

leave = (guild, log, data) => {
  return new Promise(async (resolve, reject) => {
    const {member} = data;

    const embed = new MessageEmbed();
    embed.setColor('BLURPLE');

    const displayName = functions.formatDisplayName(member.user, member);
    embed.setFooter(util.format(functions.translatePhrase('log_leave', guild.db.language), displayName, member.id));

    try {
      resolve(push(guild, log, embed, {type: constants.Log.LEAVE, member}));
    } catch (err) {
      reject(err);
    }
  });
};

kick = (guild, log, data) => {
  return new Promise(async (resolve, reject) => {
    const {member, executor} = data;

    const embed = new MessageEmbed();
    embed.setColor('RED');

    const displayName = functions.formatDisplayName(member.user, member);
    const executorName = functions.formatDisplayName(executor.user, executor);
    embed.setFooter(util.format(functions.translatePhrase('log_kick', guild.db.language), displayName, executorName));

    try {
      resolve(push(guild, log, embed, {type: constants.Log.KICK, member, executor}));
    } catch (err) {
      reject(err);
    }
  });
};

ban = (guild, log, data) => {
  return new Promise(async (resolve, reject) => {
    const {member, executor, reason} = data;
    const {user} = member;

    const embed = new MessageEmbed();
    embed.setColor('DARK_RED');

    const displayName = functions.formatDisplayName(user, member);
    embed.setFooter(util.format(functions.translatePhrase('log_ban', guild.db.language), displayName));

    if (executor) {
      const executorName = functions.formatDisplayName(executor.user, executor);
      embed.setFooter(util.format(functions.translatePhrase('log_ban_audit', guild.db.language), displayName, executorName));
    }

    let content = '';
    const files = [];

    if (reason) content += util.format(functions.translatePhrase('log_reason', guild.db.language), reason);

    if (user.messages && user.messages[guild.id]) {
      if (content.length > 0) content += '\n';
      const u = v4();

      files.push({type: constants.AttachmentType.MESSAGES, attachment: Buffer.from(functions.formatBulkMessages(user.messages[guild.id], true), 'utf-8'), name: `${u}.txt`});
      embed.setDescription(util.format(functions.translatePhrase('log_messages_attachment', guild.db.language), u));
      delete user.messages[guild.id];
    }

    try {
      resolve(push(guild, log, embed, {type: constants.Log.BAN, member, executor, reason}, files));
    } catch (err) {
      reject(err);
    }
  });
};

unban = (guild, log, data) => {
  return new Promise(async (resolve, reject) => {
    const {user, executor} = data;

    const embed = new MessageEmbed();
    embed.setColor('GREEN');

    const displayName = functions.formatDisplayName(user);
    embed.setFooter(util.format(functions.translatePhrase('log_unban', guild.db.language), displayName));

    if (executor) {
      const executorName = functions.formatDisplayName(executor.user, executor);
      embed.setFooter(util.format(functions.translatePhrase('log_unban_audit', guild.db.language), displayName, executorName));
    }

    try {
      resolve(push(guild, log, embed, {type: constants.Log.UNBAN, user, executor}));
    } catch (err) {
      reject(err);
    }
  });
};

role = (guild, log, data) => {
  return new Promise(async (resolve, reject) => {
    const {member, role, executor} = data;

    const embed = new MessageEmbed();
    embed.setColor(role.$add ? 'GOLD' : 'DARK_BLUE');

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
      resolve(push(guild, log, embed, {type: role.$add ? constants.Log.ROLE_ADD : constants.Log.ROLE_REMOVE, member, role, executor}));
    } catch (err) {
      reject(err);
    }
  });
};

username = (guild, log, data) => {
  return new Promise(async (resolve, reject) => {
    const {oldUser, member} = data;

    const embed = new MessageEmbed();
    embed.setColor('PURPLE');

    const displayName = functions.formatDisplayName(oldUser, member.displayName !== member.user.username ? member : null);
    embed.setFooter(util.format(functions.translatePhrase('log_username', guild.db.language), displayName, member.user.tag));

    try {
      resolve(push(guild, log, embed, {type: constants.Log.USERNAME_UPDATE, member}));
    } catch (err) {
      reject(err);
    }
  });
};

nickname = (guild, log, data) => {
  return new Promise(async (resolve, reject) => {
    const {oldMember, newMember, executor} = data;

    const embed = new MessageEmbed();
    embed.setColor('DARK_PURPLE');

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
      resolve(push(guild, log, embed, {type: constants.Log.NICKNAME_UPDATE, oldMember, newMember, executor}));
    } catch (err) {
      reject(err);
    }
  });
};

push = async (guild, log, embed, data, files = []) => {
  if (data.embeds) {
    for (const messageEmbed of data.embeds) {
      try {
        await this.send(guild, log, messageEmbed);
      } catch { }
    }
  }

  try {
    await send(guild, log, embed, files);
  } catch { }

  /*
  let message;

  try {
    message = await send(guild, log, embed, files);
  } catch { }

  try {
    await sql.insertLog(guild, message, data);
  } catch { }
  */
};

send = (guild, log, embed, files = []) => {
  return new Promise(async (resolve, reject) => {
    const {channel, webhook} = log;

    if (webhook) {
      try {
        return resolve(await webhook.send({embeds: [embed], files}));
      } catch { }
    }

    const guildChannel = guild.channels.resolve(channel);
    if (!guildChannel || !guildChannel.permissionsFor(guild.me).has(['SEND_MESSAGES', 'EMBED_LINKS', 'ATTACH_FILES'])) return resolve();

    try {
      resolve(await guildChannel.send({embed, files}));
    } catch (err) {
      reject(err);
    }
  });
};
