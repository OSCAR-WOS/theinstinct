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
    } catch (e) { reject(e); }
  })
}

module.exports.loadGuild = function(client, id) {
  let values = { id: id, prefix: process.env.prefix, lang: process.env.language, managers: [ process.env.owner ], commands: [], enabledModules: enabledModules, cases: null,logs: { channel: null, webhook: { id: null, token: null }}, files: { channel: null, webhook: { id: null, token: null }}, blogs: { channel: null, webhook: { id: null, token: null }}}

  return new Promise(async (resolve, reject) => {
    try {
      let guild = await findGuild(id);
     
      if (!guild) await db.collection('guilds').insertOne(values);
      else values = guild;

      client.commands.forEach(async command => {
        if (!values.commands.find(com => com.command == command.command)) values.commands.push({ command: command.command, aliases: command.aliases });
        await updateGuild(id, { commands: values.commands });
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
  let timestamp = Date.valueOf();
  data.name = functions.formatDisplayName(member.user, member);
  data.executorName = functions.formatDisplayName(executor.user, executor);
  let values = { id: guild.infractions, guild: guild.id, member: member.id, executor: executor ? executor.id : null, reasons: [{ reason: reason, executor: executor ? executor.id : null, timestamp: timestamp }], data: data, timestamp: timestamp }

  return new Promise((resolve, reject) => {
    db.collection('infractions').insertOne(values, (err, result) => {
      if (err) reject(err);
      guild.infractions++;
      resolve(result);
    })
  })
}

module.exports.updateInfraction = function(id, data = { }) {
  let query = { };
  if (data.message) query['$set'] = { 'data.message': data.message }
  if (data.reason) query['$push'] = { reasons: { reason: data.reason, executor: data.executor ? data.executor.id : null, timestamp: Date.valueOf() }}

  return new Promise((resolve, reject) => {
    db.collection('infractions').findOneAndUpdate({ _id: id }, query, (err, result) => {
      if (err) reject(err);
      resolve(result);
    })
  })
}

module.exports.findInfractions = function(id, find = { }) {
  let query = { guild: id };
  if (find.id) query['id'] = find.id;
  if (find.member) query['member'] = find.member;
  if (find.executor) query['executor'] = find.executor;

  return new Promise((resolve, reject) => {
    db.collection('infractions').find(query).toArray((err, result) => {
      if (err) reject(err);
      resolve(result);
    })
  })
}

module.exports.insertAttachment = function(channel, id, url) {
  return new Promise((resolve, reject) => {
    db.collection('attachments').insertOne({ channel: channel, id: id, url: url }, (err, result) => {
      if (err) reject(err);
      resolve(result);
    })
  })
}

module.exports.findAttachment = function(channel, id) {
  return new Promise((resolve, reject) => {
    db.collection('attachments').findOne({ channel: channel, id: id }, (err, result) => {
      if (err) reject(err);
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

function updateGuild(id, data = { }) {
  let query = { $set: { }};

  if (data.lang) query['$set']['lang'] = data.lang;
  if (data.prefix) query['$set']['prefix'] = data.prefix;
  if (data.commands) query['$set']['commands'] = data.commands;
  if (data.managers) query['$set']['managers'] = data.managers;
  if (data.enabledModules) query['$set']['enabledModules'] = data.enabledModules;
  if (data.cases) query['$set']['cases'] = data.cases;

  if (data.logs) {
    query['$set']['logs.channel'] = data.logs.channel;
    if (data.logs.webhook) query['$set']['logs.webhook'] = data.logs.webhook;
  }

  if (data.files) {
    query['$set']['files.channel'] = data.files.channel;
    if (data.files.webhook) query['$set']['files.webhook'] = data.files.webhook;
  }

  if (data.blogs) {
    query['$set']['blogs.channel'] = data.blogs.channel;
    if (data.blogs.webhook) query['$set']['blogs.webhook'] = data.blogs.webhook;
  }

  return new Promise((resolve, reject) => { 
    db.collection('guilds').findOneAndUpdate({ id: id }, query, (err, result) => {
      if (err) reject(err);
      resolve(result);
    })
  })
}

module.exports.enabledModules = enabledModules;
module.exports.updateGuild = updateGuild;