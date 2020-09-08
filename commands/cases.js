const functions = require('../functions/functions.js');
const sql = require('../functions/sql.js');

const util = require('util');

module.exports = {
  aliases: ['cases'],
  channel: ['text'],
  userPermissions: ['MANAGE_GUILD'],
  botPermissions: ['MANAGE_CHANNELS'],
  run(client, message, args) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!args[1]) return resolve(await functions.sendMessage(message.channel, functions.messageType.USAGE, { content: util.format(functions.translatePhrase('cases_usage', message.guild.db.lang), message.guild.db.prefix, args[0])}));

        let channel = await functions.resolveChannel(message, args[1], 'text', true);
        if (!channel) return;

        message.guild.db.cases = channel.id;
        await sql.updateGuild(message.guild.id, { cases: channel.id });
        resolve(await functions.sendMessage(message.channel, functions.messageType.SUCCESS, { content: util.format(functions.translatePhrase('cases_set', message.guild.db.lang), `<#${channel.id}>`)}));
      } catch (e) { reject(e); }
    })
  }
}