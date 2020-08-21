const functions = require('./functions.js');
const { MongoClient } = require('mongodb');
var db;

var enabledModules = [ 'message_delete', 'message_update', 'message_bulk_delete', 'join', 'leave', 'ban', 'kick' ];

module.exports.connect = function() {
  return new Promise(async (resolve, reject) => {
    try {
      const mongoClient = new MongoClient(process.env.mongodb, { useNewUrlParser: true, useUnifiedTopology: true });
      let connection = await mongoClient.connect();
      db = connection.db('instinct');
      resolve();
    } catch (err) { reject(err); }
  })
}

module.exports.loadGuild = function(client, id) {
  return new Promise(async (resolve, reject) => {
    try {
      let guild = await findGuild(id);
      let values = { id: id, prefix: process.env.prefix, lang: process.env.lang, managers: [ process.env.owner ], commands: [], tags: [], logs: { channel: null, webhook: { id: null, token: null }}, files: { channel: null, webhook: { id: null, token: null }}, enabledModules: enabledModules }

      if (!guild) await db.collection('guilds').insertOne(values);
      else values = guild;
      
      client.commands.forEach(async (command) => {
        if (!values.commands.find(com => com.command == command.command)) {
          values.commands.push({ command: command.command, aliases: command.aliases });
          await updateCommands(id, values.commands);
        }
      })

      resolve(values);
    } catch (e) { reject(e); }
  })
}

module.exports.loadInfractionCount = function(id) {
  return new Promise((resolve, reject) => {
    db.collection('infractions').find({ guild: id }).toArray((err, result) => {
      if (err) reject(err);
      resolve(result.length + 1);
    })
  })
}

module.exports.insertInfraction = function(guild, member, executor, reason, data) {
  return new Promise((resolve, reject) => {
    data.name = functions.formatDisplayName(member.user, member);
    let values = { id: guild.infractions, guild: guild.id, member: member.id, executor: executor ? executor.id : null, reasons: [{ reason: reason, executor: executor ? executor.id : null }], data: data }

    db.collection('infractions').insertOne(values, (err, result) => {
      if (err) reject(err);
      guild.infractions++;
      resolve(result);
    })
  })
}

module.exports.updateInfraction = function(id, data) {
  let query = { };
  if (data.message) query['$set'] = { 'data.message': data.message }
  if (data.reason) query['$push'] = { reasons: data.reason }

  return new Promise((resolve, reject) => {
    db.collection('infractions').findOneAndUpdate({ _id: id }, query, (err, result) => {
      if (err) reject(err);
      resolve(result);
    })
  })
}

module.exports.findInfractions = function(id, find) {
  let query = { guild: id };
  if (find.target) query['member'] = find.target;
  if (find.executor) query['executor'] = find.executor;

  console.log(query);

  return new Promise((resolve, reject) => {
    db.collection('infractions').find(query).toArray((err, result) => {
      if (err) reject(err);

      console.log(result);
      resolve(result);
    })
  })
}

function findGuild(id) {
  return new Promise((resolve, reject) => {
    db.collection('guilds').findOne({ id: id }, (err, result) => {
      if (err) reject(err);
      resolve(result);
    })
  })
}

function updateCommands(id, commands) {
  return new Promise((resolve, reject) => {
    db.collection('guilds').findOneAndUpdate({ id: id }, { $set: { commands: commands }}, (err, result) => {
      if (err) reject(err);
      resolve(result);
    })
  })
}