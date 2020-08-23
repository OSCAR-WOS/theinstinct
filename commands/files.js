const functions = require('../functions.js');
const sql = require('../sql.js');

const util = require('util');

module.exports = {
  aliases: ['files', 'attachments'],
  channel: ['text'],
  userPermissions: ['MANAGE_GUILD'],
  botPermissions: ['MANAGE_CHANNELS', 'MANAGE_WEBHOOKS'],
  run(client, message, args) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!args[1]) return resolve(await functions.sendMessage(message.channel, functions.messageType.USAGE, { content: util.format(functions.translatePhrase('files_usage', message.guild.db.lang), message.guild.db.prefix, args[0])}));

        let channel = await functions.resolveChannel(message, args[1], 'text', true);
        if (!channel) return;

        let webhook = await functions.setupWebhook(channel, 'Files');
        if (!webhook) return;

        message.guild.db.files = { channel: channel.id, webhook: { id: webhook.id, token: webhook.token }}
        message.guild.hook.files = await client.fetchWebhook(webhook.id, webhook.token);
        
        await sql.updateGuild(message.guild.id, { files: message.guild.db.files });
        resolve(await functions.sendMessage(message.channel, functions.messageType.SUCCESS, { content: util.format(functions.translatePhrase('files_set', message.guild.db.lang), `<#${channel.id}>`)}));
      } catch (e) { reject(e); }
    })
  }
}