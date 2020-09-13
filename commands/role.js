const functions = require('../functions/functions.js');
const sql = require('../functions/sql.js');

const util = require('util');

module.exports = {
  aliases: ['role'],
  channel: ['text'],
  userPermissions: ['MANAGE_GUILD'],
  botPermissions: ['MANAGE_ROLES'],
  run(client, message, args) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!args[1]) return resolve(await functions.sendMessage(message.channel, functions.messageType.USAGE, { content: util.format(functions.translatePhrase('role_usage', message.guild.db.lang), message.guild.db.prefix, args[0])}));

        switch (args[1]) {
          case 'setup': case 's': return resolve(await setup(message, args));
          case 'mute': case 'm': return resolve(await mute(message, args));
          case 'punish': case 'p': return resolve(await punish(message, args));
          case 'gag': case 'g': return resolve(await gag(message, args));
          default: return resolve(await functions.sendMessage(message.channel, functions.messageType.USAGE, { content: util.format(functions.translatePhrase('role_usage', message.guild.db.lang), message.guild.db.prefix, args[0])}));
        }
      } catch (e) { reject(e); }
    })
  }
}

function setup(message, args) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!message.guild.db.roles.mute || !message.guild.roles.cache.get(message.guild.db.roles.mute)) {
        let role = await message.guild.roles.create({ data: { name: 'Muted', color: 'LIGHT_GREY', permissions: 0 }});
        message.guild.db.roles.mute = role.id;
      }

      if (!message.guild.db.roles.punish || !message.guild.roles.cache.get(message.guild.db.roles.punish)) {
        let role = await message.guild.roles.create({ data: { name: 'Punished', color: 'LIGHT_GREY', permissions: 0 }});
        message.guild.db.roles.punish = role.id;
      }

      if (!message.guild.db.roles.gag || !message.guild.roles.cache.get(message.guild.db.roles.gag)) {
        let role = await message.guild.roles.create({ data: { name: 'Gagged', color: 'LIGHT_GREY', permissions: 0 }});
        message.guild.db.roles.gag = role.id;
      }

      message.guild.channels.cache.forEach(async channel => await functions.channelPermissions(channel));
      await sql.updateGuild(message.guild.id, { roles: message.guild.db.roles });
      resolve(await functions.sendMessage(message.channel, functions.messageType.SUCCESS, { content: util.format(functions.translatePhrase('role_setup', message.guild.db.land), `<@&${message.guild.db.roles.mute}>`, `<@&${message.guild.db.roles.punish}>`, `<@&${message.guild.db.roles.gag}>`)}));
    } catch (e) { reject(e); }
  })
}

function mute(message, args) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!args[2]) return resolve(await functions.sendMessage(message.channel, functions.messageType.USAGE, { content: util.format(functions.translatePhrase('role_usage_mute', message.guild.db.lang), message.guild.db.prefix, args[0])}));

      let role = await functions.resolveRole(message, args[2]);
      if (!role) return resolve();

      message.guild.db.roles.mute = role.id;
      await sql.updateGuild(message.guild.id, { roles: message.guild.db.roles });
      resolve(await functions.sendMessage(message.channel, functions.messageType.SUCCESS, { content: util.format(functions.translatePhrase('role_set_mute', message.guild.db.lang), `<@&${role.id}>`)}));
    } catch (e) { reject(e); }
  })
}

function punish(message, args) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!args[2]) return resolve(await functions.sendMessage(message.channel, functions.messageType.USAGE, { content: util.format(functions.translatePhrase('role_usage_punish', message.guild.db.lang), message.guild.db.prefix, args[0])}));

      let role = await functions.resolveRole(message, args[2]);
      if (!role) return resolve();

      message.guild.db.roles.punish = role.id;
      await sql.updateGuild(message.guild.id, { roles: message.guild.db.roles });
      resolve(await functions.sendMessage(message.channel, functions.messageType.SUCCESS, { content: util.format(functions.translatePhrase('role_set_punish', message.guild.db.lang), `<@&${role.id}>`)}));
    } catch (e) { reject(e); }
  })
}

function gag(message, args) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!args[2]) return resolve(await functions.sendMessage(message.channel, functions.messageType.USAGE, { content: util.format(functions.translatePhrase('role_usage_gag', message.guild.db.lang), message.guild.db.prefix, args[0])}));

      let role = await functions.resolveRole(message, args[2]);
      if (!role) return resolve();

      message.guild.db.roles.gag = role.id;
      await sql.updateGuild(message.guild.id, { roles: message.guild.db.roles });
      resolve(await functions.sendMessage(message.channel, functions.messageType.SUCCESS, { content: util.format(functions.translatePhrase('role_set_gag', message.guild.db.lang), `<@&${role.id}>`)}));
    } catch (e) { reject(e); }
  })
}