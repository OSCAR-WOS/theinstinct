const constants = require('./constants.js');

const MongoClient = require('mongodb').MongoClient;
let db;

exports.connect = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const client = new MongoClient(process.env.database, {useNewUrlParser: true, useUnifiedTopology: true});
      const connection = await client.connect();
      resolve(db = connection.db('instinct'));
    } catch (err) {
      reject(err);
    }
  });
};

exports.loadGuild = (id) => {
  let values = {
    id,
    prefix: process.env.prefix,
    language: process.env.language,
    managers: [process.env.owner],
    logs: {channel: null, webhook: {id: null, token: null}, detailed: {}, setting: constants.LogSetting.SIMPLE, enabled: true},
    files: {channel: null, webhook: {id: null, token: null}, enabled: false},
    blogs: {channel: null, webhook: {id: null, token: null}, enabled: false},
    roles: {mute: null, punish: null, gag: null},
    cases: null,
    infractions: 0,
  };

  Object.values(constants.Log).forEach((type) => values.logs.detailed[type] = {channel: null, webhook: {id: null, token: null}, enabled: true});

  return new Promise(async (resolve, reject) => {
    try {
      const guild = await findGuild(id);

      if (!guild) await db.collection('guilds').insertOne(values);
      else values = guild;

      resolve(values);
    } catch (err) {
      reject(err);
    }
  });
};

exports.insertAttachment = (channel, id, url) => {
  return new Promise((resolve, reject) => {
    db.collection('attachments').insertOne({channel, id, url}, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

exports.keepAttachment = (channel, id) => {
  const query = {$set: {keep: true}};

  return new Promise((resolve, reject) => {
    db.collection('attachments').findOneAndUpdate({channel, id}, query, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

exports.purgeAttachments = (channel) => {
  return new Promise((resolve, reject) => {
    db.collection('attachments').deleteMany({channel, keep: {$exists: false}}, (err, result) => {
      if (err) reject(err);

      db.collection('attachments').updateMany({channel}, {$unset: {keep: ''}}, (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
  });
};

exports.insertLog = (guild, message, data) => {
  const {member, executor} = data;

  const values = {
    guild: guild.id,
    timestamp: Date.now(),
    data: {},
  };

  if (message) values.data.message = message.url;

  if (member) {
    values.data.member = {id: member.id, username: member.user.username, discriminator: member.user.discriminator};
    if (member.displayName !== member.user.username) values.data.member.nickname = member.displayName;
  }

  if (executor) {
    values.data.executor = {id: executor.id, username: executor.user.username, discriminator: executor.user.discriminator};
    if (executor.displayName !== executor.user.username) values.data.executor = executor.displayName;
  }

  return new Promise(async (resolve, reject) => {
    db.collection('logs').insertOne(values, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

findGuild = (id) => {
  return new Promise((resolve, reject) => {
    db.collection('guilds').findOne({id}, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};

updateGuild = (id, data = { }) => {
  const query = {$set: { }};

  if (data.prefix) query.$set.prefix = data.prefix;
  if (data.language) query.$set.language = data.language;
  if (data.managers) query.$set.managers = data.managers;
  if (data.roles) query.$set.roles = data.roles;

  if (data.logs) query.$set.logs = data.logs;
  if (data.files) query.$set.files = data.files;
  if (data.blogs) query.$set.blogs = data.blogs;

  return new Promise((resolve, reject) => {
    db.collection('guilds').findOneAndUpdate({id}, query, (err, result) => {
      if (err) reject(err);
      resolve(result);
    });
  });
};
