if (process.env.ENV !== 'production') require('dotenv').config();

init = async () => {
  try {
    const sql = require('./helpers/sql.js');

    const fs = require('fs');
    const Discord = require('discord.js');
    const client = new Discord.Client({fetchAllMembers: true});

    client.commands = new Discord.Collection();
    client.events = [];
    module.exports = client;

    fs.readdir('./events/', (err, files) => {
      if (err) return console.error(err);

      return files.forEach((file) => {
        const event = require(`./events/${file}`);
        const eventName = file.split('.')[0];
        client.on(eventName, event.bind(null, client));
      });
    });

    fs.readdir('./commands/', (err, files) => {
      if (err) return console.error(err);

      return files.forEach((file) => {
        if (!file.endsWith('.js')) return;

        const props = require(`./commands/${file}`);
        props.command = file.split('.')[0];
        client.commands.set(props.command, props);
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
