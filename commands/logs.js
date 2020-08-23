const functions = require('../functions.js');
const sql = require('../sql.js');

const util = require('util');

module.exports = {
  aliases: ['logs'],
  channel: ['text'],
  userPermissions: ['MANAGE_GUILD'],
  botPermissions: ['MANAGE_CHANNELS', 'MANAGE_WEBHOOKS'],
  run(client, message, args) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!args[1]) return resolve(await functions.sendMessage(message.channel, functions.messageType.USAGE, { content: util.format(functions.translatePhrase('logs_usage', message.guild.db.lang), message.guild.db.prefix, args[0])}));
      } catch (e) { reject(e); }
    })
  }
}