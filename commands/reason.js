const functions = require('../functions.js');
const sql = require('../sql.js');
const log = require('../log.js');

const util = require('util');

module.exports = {
  aliases: ['reason'],
  channel: ['text'],
  userPermissions: ['MANAGE_MESSAGE'],
  run(client, message, args) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!args[2]) return resolve(await functions.sendMessage(message.channel, functions.messageType.USAGE, { content: util.format(functions.translatePhrase('reason_usage', message.guild.db.lang), message.guild.db.prefix, args[0])}));
        if (message.guild.infactions - 1 == 0) return resolve(await functions.sendMessage(message.channel, functions.messageType.ERROR, { content: functions.translatePhrase('case_none', message.guild.db.lang)}));

        let number = parseInt(args[1]);
        if (isNaN(number) || number < 1 || number > message.guild.infractions - 1) return resolve(await functions.sendMessage(message.channel, functions.messageType.ERROR, { content: util.format(functions.translatePhrase('case_invalid', message.guild.db.lang), message.guild.infractions - 1)}));

        let query = await sql.findInfractions(message.guild.id, { id: number });
        if (!query || !query[0].data.message) return resolve(await functions.sendMessage(message.channel. functions.messageType.ERROR, { content: util.format(functions.translatePhrase('case_notfound', message.guild.db.lang), number)}));

        let logMessage = await message.guild.channels.cache.get(message.guild.db.logs.channel).messages.fetch(query[0].data.message);
        if (!logMessage) return resolve(await functions.sendMessage(message.channel. functions.messageType.ERROR, { content: util.format(functions.translatePhrase('case_notfound', message.guild.db.lang), number)}));

        let reason = args.slice(2).join(' ');

        await sql.updateInfraction(query[0]._id, { reason: reason, executor: message.member });
        await log.send(message.guild, { message: logMessage, update: message.member, case: number, executorName: query[0].data.executorName, member: query[0].member, name: query[0].data.name, reason: reason }, query[0].data.type);
        resolve(await functions.sendMessage(message.channel, functions.messageType.SUCCESS, { content: util.format(functions.translatePhrase('reason_update', message.guild.db.land), number)}));
      } catch (e) { reject(e); }
    })
  }
}