const functions = require('../functions/functions.js');
const infraction = require('../functions/infraction.js');

const util = require('util');
const parse = require('parse-duration');

module.exports = {
  aliases: ['mute'],
  channel: ['text'],
  userPermissions: ['MANAGE_MESSAGES'],
  botPermissions: ['MANAGE_ROLES'],
  run(client, message, args) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!message.guild.db.roles.mute || !message.guild.roles.cache.get(message.guild.db.roles.mute)) return resolve(await functions.sendMessage(message.channel, functions.messageType.ERROR, { content: util.format(functions.translatePhrase('mute_set', message.guild.db.lang), message.guild.db.prefix)}));
        if (!args[1]) return resolve(await functions.sendMessage(message.channel, functions.messageType.USAGE, { content: util.format(functions.translatePhrase('mute_usage', message.guild.db.lang), message.guild.db.prefix, args[0])}));

        let user = await functions.resolveUser(message, args[1], 'text', true);
        if (!user) return resolve();

        let member = message.guild.member(user);
        if (member.roles.cache.get(message.guild.db.roles.mute)) return resolve(await functions.sendMessage(message.channel, functions.messageType.ERROR, { content: util.format(functions.translatePhrase('mute_muted', message.guild.db.lang), `<@${member.id}>`)}));

        let length = null;
        if (args[2]) length = parse(args[2]);

        let reason = null;
        if (args.length > (2 + (!length ? 0 : 1))) reason = args.slice(!length ? 2 : 3).join(' ');

        await member.roles.add(message.guild.db.roles.mute);
        let query = await infraction.send(message.guild, { member, executor: message.member, reason, length }, infraction.Type.MUTE);

        if (length) client.events.push({ id: query.value._id, timestamp: new Date().valueOf() + length });
        resolve(await functions.sendMessage(message.channel, functions.messageType.SUCCESS, { content: util.format(functions.translatePhrase('mute_success', message.guild.db.land), `<@${member.id}>`)}));
      } catch (e) { reject(e); }
    })
  }
}