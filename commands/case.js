const functions = require('../functions.js');
const sql = require('../sql.js');

const util = require('util');

module.exports = {
  aliases: ['case'],
  channel: ['text'],
  userPermissions: ['MANAGE_MESSAGE'],
  run(client, message, args) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!args[1]) return resolve(await functions.sendMessage(message.channel, functions.messageType.USAGE, { content: util.format(functions.translatePhrase('case_usage', message.guild.db.lang), message.guild.db.prefix, args[0])}));

        let number = parseInt(args[1]);
        if (isNaN(number) || number < 1 || number > message.guild.infractions) return resolve(await functions.sendMessage(message.channel, functions.messageType.ERROR, { content: util.format(functions.translatePhrase('case_invalid', message.guild.db.lang), message.guild.infractions)}));
      } catch (e) { reject(e); }
    })
  }
}