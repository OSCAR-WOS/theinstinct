const functions = require('../functions/functions.js');
const sql = require('../functions/sql.js');
const infraction = require('../functions/infraction.js');

const util = require('util');

module.exports = {
  aliases: ['unmute'],
  channel: ['text'],
  userPermissions: ['MANAGE_MESSAGES'],
  botPermissions: ['MANAGE_ROLES'],
  run(client, message, args) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!message.guild.db.roles.mute || !message.guild.roles.cache.get(message.guild.db.roles.mute)) return resolve(await functions.sendMessage(message.channel, functions.messageType.ERROR, { content: util.format(functions.translatePhrase('mute_set', message.guild.db.lang), message.guild.db.prefix)}));
        if (!args[1]) return resolve(await functions.sendMessage(message.channel, functions.messageType.USAGE, { content: util.format(functions.translatePhrase('unmute_usage', message.guild.db.lang), message.guild.db.prefix, args[0])}));

        let user = await functions.resolveUser(message, args[1], 'text', true);
        if (!user) return resolve();

        let member = message.guild.member(user);
        if (!member.roles.cache.get(message.guild.db.roles.mute)) return resolve(await functions.sendMessage(message.channel, functions.messageType.ERROR, { content: util.format(functions.translatePhrase('unmute_notmuted', message.guild.db.lang), `<@${member.id}>`)}));
        await member.roles.remove(message.guild.db.roles.mute);

        let queries = await sql.findInfractions({ guild: message.guild.id, member: member.id, type: infraction.Type.MUTE });
        queries.forEach(async query => await sql.updateInfraction(query._id, { executed: true }));
        resolve(await functions.sendMessage(message.channel, functions.messageType.SUCCESS, { content: util.format(functions.translatePhrase('unmute_success', message.guild.db.land), `<@${member.id}>`)}));
      } catch (e) { reject(e); }
    })
  }
}