const client = require('../index.js');
const functions = require('../functions/functions.js');
const fetch = require('node-fetch');

var regex = new RegExp(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/g);
const guild = '155454244315463681';

const allowedFormats = [
  'video/x-msvideo',
  'image/bmp',
  'image/gif',
  'image/jpeg',
  'video/mp4',
  'video/mpeg',
  'video/ogg',
  'image/png',
  'image/svg+xml',
  'image/tiff',
  'video/mp2t',
  'video/webm',
  'image/webp',
  'video/3gpp',
  'video/3gpp2'
]

const selfRoleMessage = { guild: '155454244315463681', channel: '746111444835369040',  message: '' }
const selfRoles = [
  { emoji: '🎮', role: '737838305759985764'},
  { emoji: '🤓', role: '737838308314316851'},
  { emoji: '🎨', role: '738207408840507443'},
  { emoji: '🌸', role: '737838465881997322'},
  { emoji: '🥺', role: '738237414543458324'}
]

client.on('ready', async () => {
  try { await client.channels.cache.get(selfRoleMessage.channel).messages.fetch(selfRoleMessage.message);
  } catch { }
})

client.on('message', async message => {
  if (message.guild.id != guild) return;

  if (message.channel.id == '746388677978095748') {
    if (message.member.permissions.has('MANAGE_MESSAGES')) return;
    if (!await checksfw(message)) return await functions.deleteMessage(message, true);
  }

  if (message.content == '¬setup' && message.author.id == '502266076545941514') {
    let embed = new Discord.MessageEmbed();
    embed.setDescription('React to be assigned your role!');
    let sent = await message.channel.send({ embed });

    selfRoles.forEach(role => {
      sent.react(role.emoji);
    })
  }
})

client.on('messageReactionAdd', async (messageReaction, user) => {
  if (messageReaction.message.id != selfRoleMessage.message) return;
  let member = messageReaction.message.guild.member(user);
  if (!member) return;

  let role = selfRoles.find(role => role.emoji == messageReaction.emoji.name);
  if (!member.roles.cache.has(role.role)) {
    try { await member.roles.add(role.role);
    } catch { }
  }
})

client.on('messageReactionRemove', (messageReaction, user) => {
  if (messageReaction.message.id != selfRoleMessage.message) return;
  let member = messageReaction.message.guild.member(user);
  if (!member) return;

  let role = selfRoles.find(role => role.emoji == messageReaction.emoji.name);
  if (member.roles.cache.has(role.role)) {
    try { await member.roles.remove(role.role);
    } catch { }
  }
})

async function checksfw(message) {
  if (message.embeds.length > 0) {
    let embed = message.embeds[0];
    if (embed.image || embed.video) return true;
  }

  if (message.attachments.size > 0) {
    if (message.attachments.first().height) return true;
  }

  let match = null;
  match = message.cleanContent.match(regex);

  if (match) {
    try {
      let file = await fetch(match[0]);
      if (allowedFormats.includes(file.headers.get('content-type'))) return true;
    } catch { }
  }

  return false;
}