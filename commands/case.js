const functions = require('../functions/functions.js');
const sql = require('../functions/sql.js');

const util = require('util');

module.exports = {
  aliases: ['case'],
  channel: ['text'],
  userPermissions: ['MANAGE_MESSAGE'],
  run(client, message, args) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!args[1]) return resolve(await functions.sendMessage(message.channel, functions.messageType.USAGE, { content: util.format(functions.translatePhrase('case_usage', message.guild.db.lang), message.guild.db.prefix, args[0])}));
        if (message.guild.infactions - 1 == 0) return resolve(await functions.sendMessage(message.channel, functions.messageType.ERROR, { content: functions.translatePhrase('case_none', message.guild.db.lang)}));

        let number = parseInt(args[1]);
        if (isNaN(number) || number < 1 || number > message.guild.infractions - 1) return resolve(await functions.sendMessage(message.channel, functions.messageType.ERROR, { content: util.format(functions.translatePhrase('case_invalid', message.guild.db.lang), message.guild.infractions - 1)}));

        let query = await sql.findInfractions(message.guild.id, { id: number });
        if (!query) return resolve(await functions.sendMessage(message.channel. functions.messageType.ERROR, { content: util.format(functions.translatePhrase('case_notfound', message.guild.db.lang), number)}));
      } catch (e) { reject(e); }
    })
  }
}