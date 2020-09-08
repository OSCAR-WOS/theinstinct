const functions = require('./functions.js');
const sql = require('./sql.js');

const util = require('util');
const { MessageEmbed } = require('discord.js');

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
      if (!data.case) {
        data.case = guild.infractions;
        data.sql = await sql.insertInfraction(guild, data.member, data.executor, data.reason, { type });
      }

      switch (type) {
        case Type.BAN: return resolve(await ban(guild, data));
        case Type.KICK: return resolve(await kick(guild, data));
        case Type.MUTE: return resolve(await mute(guild, data));
        case Type.PUNISH: return resolve(await punish(guild, data));
        case Type.GAG: return resolve(await gag(guild, data));
      }
    } catch (e) { reject(e); console.error(e); }
  })
}

function ban(guild, data) {
  return new Promise(async (resolve, reject) => {
    let embed = new MessageEmbed();

    let content = '';
    content = util.format(functions.translatePhrase('infraction_kick', guild.db.lang), `<@${data.member.id}>`, `<@${data.executor.id}>`);
    if (data.reason) content += `\n${util.format(functions.translatePhrase('log_reason', guild.db.lang), data.reason)}`;
    embed.setDescription(content);

    if (data.edit) embed.setFooter(util.format(functions.translatePhrase('infraction_footer_edit', guild.db.lang), data.case, functions.formatDisplayName(data.edit.member.user, data.edit.member)));
    else embed.setFooter(util.format(functions.translatePhrase('infraction_footer', guild.db.lang), data.case));

    try { 
      if (data.edit) resolve(await edit(data.message, embed, data));
      else resolve(await send(guild, embed, data.sql));
    } catch (e) { reject(e); }
  })
}

function kick(guild, data) {
  return new Promise(async (resolve, reject) => {
    let embed = new MessageEmbed();

    console.log('1');

    let content = '';
    content = util.format(functions.translatePhrase('infraction_kick', guild.db.lang), `<@${data.member.id}>`, `<@${data.executor.id}>`);
    if (data.reason) content += `\n${util.format(functions.translatePhrase('log_reason', guild.db.lang), data.reason)}`;
    embed.setDescription(content);

    if (data.edit) embed.setFooter(util.format(functions.translatePhrase('infraction_footer_edit', guild.db.lang), data.case, functions.formatDisplayName(data.edit.user, data.edit)));
    else embed.setFooter(util.format(functions.translatePhrase('infraction_footer', guild.db.lang), data.case));

    try { 
      if (data.edit) resolve(await edit(data.message, embed, data));
      else resolve(await send(guild, embed, data.sql));
    } catch (e) { reject(e); }
  })
}

function mute(guild, data) {
  return new Promise(async (resolve, reject) => {
    try { resolve(await send(guild, embed, data.sql));
    } catch (e) { reject(e); }
  })
}

function punish(guild, data) {
  return new Promise(async (resolve, reject) => {
    try { resolve(await send(guild, embed, data.sql));
    } catch (e) { reject(e); }
  })
}

function gag(guild, data) {
  return new Promise(async (resolve, reject) => {
    try { resolve(await send(guild, embed, data.sql));
    } catch (e) { reject(e); }
  })
}

function send(guild, embed, query) {
  return new Promise(async (resolve, reject) => {
    let guildChannel = guild.channels.resolve(guild.db.cases);
    if (!guildChannel) return resolve(null);

    let sent = null;
    try { sent = await guildChannel.send({ embed });
    } catch (e) { reject(e); }

    try { resolve(await sql.updateInfraction(query.insertedId, { message: sent.id }));
    } catch (e) { reject(e); }
  })
}

function edit(message, embed, data) {
  return new Promise(async (resolve, reject) => {
    try {
      await message.edit({ embed });
      resolve(await sql.updateInfraction(data.query._id, { reason: data.reason, executor: data.edit }));
    } catch (e) { reject(e); }
  })
}

module.exports.Type = Type;