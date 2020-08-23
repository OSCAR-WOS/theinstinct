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

module.exports.loadGuild = function(id) {
  let values = { id: id, prefix: process.env.prefix, lang: process.env.lang, managers: [ process.env.owner ], logs: { channel: null, webhook: { id: null, token: null }}, files: { channel: null, webhook: { id: null, token: null }}, blogs: { channel: null, webhook: { id: null, token: null }}, enabledModules: enabledModules }

  return new Promise(async (resolve, reject) => {
    try {
      let guild = await findGuild(id);
     
      if (!guild) await db.collection('guilds').insertOne(values);
      else values = guild;

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
  if (data.reason)query['$push'] = { reasons: { reason: data.reason, executor: data.executor ? data.executor.id : null, timestamp: Date.valueOf() }}

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