const client = require('../index.js');

const {GoogleSpreadsheet} = require('google-spreadsheet');
const {MessageEmbed} = require('discord.js');

const guild = '784758985021980673';
const doc = new GoogleSpreadsheet('1wjnV4YeZhK0fnk1lSEObC_o1W7wywHWhwtYhaT-ScIU');
const members = [];
const offset = 2;
const raid = 'Thursday (17:00)';

const roles = [
  {role: 'melee', color: {red: 1, green: 0.8509804, blue: 0.4}},
  {role: 'range', color: {red: 0.5568628, green: 0.4862745, blue: 0.7647059}},
  {role: 'tank', color: {red: 0.7058824, green: 0.37254903, blue: 0.023529412}},
  {role: 'heal', color: {red: 0.23921569, green: 0.52156866, blue: 0.7764706}},
];

client.on('ready', async () => {
  try {
    await doc.useServiceAccountAuth(require('./google.json'));
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle['Members'];
    await sheet.loadCells();

    for (let i = 0; i < 31; i++) {
      const character = sheet.getCell(i + offset, 0);
      const discord = sheet.getCell(i + offset, 1);

      const user = client.users.cache.find((user) => user.tag === discord.value);
      if (user) {
        members.push({character: character.value, discord: user.id, cell: i + offset});

        await user.createDM();
        if (user.dmChannel) await user.dmChannel.messages.fetch();
      }
    }
  } catch (e) {
    console.error(e);
  }
});

client.on('message', (message) => {
  if (!message.guild || message.guild.id !== guild) return;
  if (message.author.id !== process.env.owner) return;

  if (message.cleanContent === 'rolecall') rolecall();
});

rolecall = async () => {
  try {
    const sheet = doc.sheetsByTitle[raid];
    await sheet.loadCells('A3:A9999');

    for (let i = 0; i < sheet.cellStats.nonEmpty; i++) {
      const character = sheet.getCell(i + offset, 0);
      const role = roles.find((role) => JSON.stringify(role.color) === JSON.stringify(character.backgroundColor));

      try {
        const member = members.find((member) => character.value === member.character);
        if (!member) continue;

        member.raid = i;
        const user = await client.users.resolve(member.discord);

        const embed = new MessageEmbed();
        embed.setDescription(`CONFIRMATION! ${raid} for ${role.role}`);

        const message = await user.send(user, {embed});
        await message.react('✅');
      } catch {}
    }
  } catch (e) {
    console.error(e);
  }
};

client.on('messageReactionAdd', (messageReaction, user) => {
  const member = members.find((member) => user.id === member.discord);
  if (!member) return;

  if (messageReaction.emoji.name === '✅') confirm(user);
});

confirm = async (user) => {
  try {
    const sheet = doc.sheetsByTitle[raid];
    await sheet.loadCells('C3:C9999');

    const member = members.find((member) => member.discord === user.id);
    if (!member) return;

    const check = sheet.getCell(member.cell, 2);
    check.value = true;

    await sheet.saveUpdatedCells();
  } catch { }
};
