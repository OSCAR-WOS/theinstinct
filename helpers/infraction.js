const functions = require('./functions.js');
const sql = require('../helpers/sql.js');

const util = require('util');
const pretty = require('pretty-ms');
const {MessageEmbed} = require('discord.js');

const Type = {
  KICK: 'kick',
  BAN: 'ban',
  MUTE: 'mute',
  PUNISH: 'punish',
  GAG: 'gag',
};

module.exports.send = (guild, type, data = { }) => {
  return new Promise(async (resolve, reject) => {
    if (!guild.ready) return resolve();
    let infraction;

    try {
      infraction = await sql.insertInfraction(guild, data.member, data.executor, type, data.time, data);
    } catch (err) {
      reject(err);
    }

    if (!infraction || !guild.db.cases) return resolve();

    const cases = guild.channels.resolve(guild.db.cases);
    if (!cases) return resolve();

    const embed = formatCase(guild, type, data);

    try {
      const message = await cases.send({embed});
      await sql.updateInfraction(infraction._id, {message: message.id});
    } catch (err) {
      reject(err);
    }
  });
};

formatCase = (guild, type, data = { }) => {
  const embed = new MessageEmbed();

  let translation = '';
  const displayName = typeof data.member === 'string' ? data.member.data.name : functions.formatDisplayName(data.member.user, data.member);
  const executorName = typeof data.executor === 'string' ? data.executor.data.name : functions.formatDisplayName(data.executor.user, data.executor);

  switch (type) {
    case Type.KICK: translation = 'infraction_kick'; break;
    case Type.BAN: translation = 'infraction_ban'; break;
    case Type.MUTE: translation = 'infraction_mute'; break;
    case Type.PUNISH: translation = 'infraction_punish'; break;
    case Type.GAG: translation = 'infraction_gag'; break;
  }

  let content = util.format(functions.translatePhrase(translation, guild.db.language), typeof data.member === 'string' ? `<@${data.member}>` : `<@${data.member.id}>`, displayName);
  if (data.time) content += `\n${util.format(functions.translatePhrase('log_time', guild.db.language), pretty(data.time))}`;
  if (data.reason) content += `\n${util.format(functions.translatePhrase('log_reason', guild.db.language), data.reason)}`;
  embed.setDescription(content);

  if (data.edit) embed.setFooter(util.format(functions.translatePhrase('infraction_footer', guild.db.language), data.id, executorName, functions.formatDisplayName(data.edit.user, data.edit)));
  else embed.setFooter(util.format(functions.translatePhrase('infraction_footer', guild.db.language), guild.db.infractions, executorName));
  return embed;
};

module.exports.Type = Type;
