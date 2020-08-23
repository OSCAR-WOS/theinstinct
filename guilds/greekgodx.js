const client = require('../index.js');
const functions = require('../functions.js');
const fetch = require('node-fetch');

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

var regex = new RegExp(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/g);

client.on('message', async message => {
  if (message.channel.id == '746388677978095748') {
    if (message.memeber.permissions.has('ADMINISTRATOR')) return;
    if (!await checksfw(message)) return await functions.deleteMessage(message, true);
  }
})

async function checksfw(message) {
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