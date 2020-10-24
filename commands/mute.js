const functions = require('../helpers/functions.js');
const infraction = require('../helpers/infraction.js');
const log = require('../helpers/log.js');

const util = require('util');
const parse = require('parse-duration');

module.exports = {
  aliases: ['mute'],
  channel: ['text'],
  userPermissions: ['MANAGE_MESSAGES'],
  botPermissions: ['MANAGE_ROLES'],
  translation: {usage: 'mute_usage', help: 'mute_help', help_brief: 'mute_help_brief', help_example: 'mute_help_example'},
  category: [functions.categoryType.MODERATION],
  run(client, message, args) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!message.guild.db.roles.mute || !message.guild.roles.cache.get(message.guild.db.roles.mute)) {
          return resolve({type: functions.messageType.USAGE, message: await functions.sendMessage(message.channel, functions.messageType.USAGE, {content: util.format(functions.translatePhrase('mute_set', message.guild.db.language), message.guild.db.prefix)})});
        }

        if (!args[1]) return resolve({type: functions.messageType.USAGE, message: await functions.sendMessage(message.channel, functions.messageType.USAGE, {content: util.format(functions.translatePhrase('mute_usage', message.guild.db.language), message.guild.db.prefix, args[0])})});

        const user = await functions.resolveUser(message, args[1], 'text', true);
        if (!user) return resolve();

        const member = message.guild.member(user);
        if (member.roles.cache.get(message.guild.db.roles.mute)) {
          return resolve({type: functions.messageType.ERROR, message: await functions.sendMessage(message.channel, functions.messageType.ERROR, {content: util.format(functions.translatePhrase('mute_muted', message.guild.db.language), `<@${member.id}>`)})});
        }

        let time;
        if (args[2]) time = parse(args[2]);

        let reason;
        if (args.length > (2 + (!time ? 0 : 1))) reason = args.slice(!time ? 2 : 3).join(' ');

        resolve({
          type: functions.messageType.SUCCESS,
          infraction: await infraction.send(message.guild, infraction.Type.MUTE, {member, executor: message.member, time, reason}),
          message: await functions.sendMessage(message.channel, functions.messageType.SUCCESS, {content: util.format(functions.translatePhrase('mute_success', message.guild.db.language), `<@${member.id}>`)}),
          log: await log.send(message.guild, log.Type.MUTE_ADD, {member, executor: message.member}),
        });
      } catch (err) {
        reject(err);
      }
    });
  },
};
