if (process.env.ENV !== 'production') require('dotenv').config();

init = async () => {
  try {
    const sql = require('./helpers/sql.js');

    const fs = require('fs');
    const Discord = require('discord.js');
    const client = new Discord.Client({fetchAllMembers: true});

    client.events = new Discord.Collection();
    client.attachments = {};
    module.exports = client;

    fs.readdir('./events/', (err, files) => {
      if (err) return console.error(err);

      return files.forEach((file) => {
        const event = require(`./events/${file}`);
        const eventName = file.split('.')[0];
        client.on(eventName, event.bind(null, client));
      });
    });

    fs.readdir('./guilds/', (err, files) => {
      if (err) return console.error(err);

      files.forEach((file) => {
        if (file.endsWith('.js')) require(`./guilds/${file}`);
      });
    });

    await sql.connect();
    client.login(process.env.token);
  } catch (err) {
    console.error(err);
  }
};

init();