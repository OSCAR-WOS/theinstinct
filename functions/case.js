const sql = require('./sql.js');

const Type = {
  BAN: 'ban',
  KICK: 'kick',
  MUTE: 'mute',
  PUNISH: 'punish',
  GAG: 'gag'
}

module.exports.send = function(guild, data, type) {
  return new Promise(async (resolve, reject) => {
    if (!guild.ready) return resolve();

    try {


      switch (type) {
        case Type.BAN: return resolve(await ban(guild, data));
        case Type.KICK: return resolve(await kick(guild, data));
        case Type.MUTE: return resolve(await mute(guild, data));
        case Type.PUNISH: return resolve(await punish(guild, data));
        case Type.GAG: return resolve(await gag(guild, data));
      }
    } catch (e) { reject(e); }
  })
}

function ban(guild, data) {
  return new Promise(async (resolve, reject) => {

  })
}

function kick(guild, data) {
  return new Promise(async (resolve, reject) => {

  })
}

function mute(guild, data) {
  return new Promise(async (resolve, reject) => {

  })
}

function punish(guild, data) {
  return new Promise(async (resolve, reject) => {

  })
}

function gag(guild, data) {
  return new Promise(async (resolve, reject) => {

  })
}

function send(guild, embed) {
  return new Promise(async (resolve, reject) => {
    
  })
}

module.exports.Type = Type;

/*
function newInfraction(guild, embed, member, executor, reason, data) {
  return new Promise(async (resolve, reject) => {
    let insert, sent = null;

    try { insert = await sql.insertInfraction(guild, member, executor, reason, data);
    } catch (e) { reject(e); }
    if (!insert) reject();

    try { sent = await send(guild, embed, false);
    } catch (e) { reject(e); }
    if (!sent) reject();

    try { resolve(await sql.updateInfraction(insert.insertedId, { message: sent.id }));
    } catch (e) { reject(e); }
  })
}

function updateInfraction(message, embed) {
  return new Promise(async (resolve, reject) => {
    try { resolve(await message.edit({ embed: embed }));
    } catch (e) { reject(e); }
  })
}
*/


/*
function logKick(guild, data) {
  return new Promise(async (resolve, reject) => {
    let embed = new MessageEmbed();
    embed.setColor('RED');

    let content = '';
    let footer = '';

    if (data.message) {
      let update = data.update;
      let updateName = functions.formatDisplayName(update.user, update);

      footer = util.format(functions.translatePhrase('log_footer_edit', guild.db.lang), data.case, data.executorName, updateName);
      content = util.format(functions.translatePhrase('log_kick', guild.db.lang), `<@${data.member}>`, data.name, data.member);
      if (data.reason) content += `\n${util.format(functions.translatePhrase('log_reason', guild.db.lang), data.reason)}`;
    } else {
      let member = data.member;
      let executor = data.executor;

      let displayName = functions.formatDisplayName(member.user, member);
      let executorName = functions.formatDisplayName(executor.user, executor);

      footer = util.format(functions.translatePhrase('log_footer', guild.db.lang), guild.infractions, executorName);
      content = util.format(functions.translatePhrase('log_kick', guild.db.lang), `<@${member.id}>`, displayName, member.id);
      if (data.reason) content += `\n${util.format(functions.translatePhrase('log_reason', guild.db.lang), data.reason)}`;
    }

    embed.setFooter(footer);
    embed.setDescription(content);

    try {
      if (data.message) resolve(await updateInfraction(data.message, embed));
      else resolve(await newInfraction(guild, embed, data.member, data.executor, data.reason, { type: Type.KICK, executorName: functions.formatDisplayName(data.executor.user, data.executor) }));
    } catch (e) { reject(e); }
  })
}

function logBan(guild, data) {
  return new Promise(async (resolve, reject) => {
    let embed = new MessageEmbed();
    embed.setColor('DARK_RED');
    
    let content = '';
    let footer = '';

    if (data.message) {
      let update = data.update;
      let updateName = functions.formatDisplayName(update.user, update);

      footer = util.format(functions.translatePhrase('log_footer_edit', guild.db.lang), data.case, data.executorName, updateName);
      content = util.format(functions.translatePhrase('log_ban', guild.db.lang), `<@${data.member}>`, data.name, data.member);
      if (data.reason) content += `\n${util.format(functions.translatePhrase('log_reason', guild.db.lang), data.reason)}`;
    } else {
      let member = data.member;
      let executor = data.executor;

      let displayName = functions.formatDisplayName(member.user, member);
      let executorName = functions.formatDisplayName(executor.user, executor);

      footer = util.format(functions.translatePhrase('log_footer', guild.db.lang), guild.infractions, executorName);
      content = util.format(functions.translatePhrase('log_ban', guild.db.lang), `<@${member.id}>`, displayName, member.id);
      if (data.reason) content += `\n${util.format(functions.translatePhrase('log_reason', guild.db.lang), data.reason)}`;
    }

    embed.setFooter(footer);
    embed.setDescription(content);

    try {
      if (data.message) resolve(await updateInfraction(data.message, embed));
      else resolve(await newInfraction(guild, embed, data.member, data.executor, data.reason, { type: Type.BAN, executorName: functions.formatDisplayName(data.executor.user, data.executor) }));
    } catch (e) { reject(e); }
  })
}
*/