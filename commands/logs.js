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

        switch (args[1]) {
          case 'set': case 's': return resolve(await set(client, message, args));
          case 'enable': case 'e': return resolve(await enable(client, message, args));
          case 'disable': case 'd': return resolve(await disable(client, message, args));
          default: return resolve(await functions.sendMessage(message.channel, functions.messageType.USAGE, { content: util.format(functions.translatePhrase('logs_usage', message.guild.db.lang), message.guild.db.prefix, args[0])}));
        }
      } catch (e) { reject(e); }
    })
  }
}

function set(client, message, args) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!args[2]) return resolve(await functions.sendMessage(message.channel, functions.messageType.USAGE, { content: util.format(functions.translatePhrase('logs_usage_set', message.guild.db.lang), message.guild.db.prefix, args[0])}));

      let channel = await functions.resolveChannel(message, args[2], 'text', true);
      if (!channel) return; // Log error

      let webhook = await functions.setupWebhook(channel, 'Logs');
      if (!webhook) return; // Log error

      message.guild.db.logs = { channel: channel.id, webhook: { id: webhook.id, token: webhook.token }}
      message.guild.hook.logs = await client.fetchWebhook(webhook.id, webhook.token);
      
      await sql.updateGuild(message.guild.id, { logs: message.guild.db.logs });
      resolve(await functions.sendMessage(message.channel, functions.messageType.SUCCESS, { content: util.format(functions.translatePhrase(''))    }))
    } catch (e) { reject(e); }
  })
}

function enable(client, message, args) {
  return new Promise(async (resolve, reject) => {
    
  })
}

function disable(client, message, args) {
  return new Promise(async (resolve, reject) => {
    
  })
}