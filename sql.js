const { MongoClient } = require('mongodb');
var db;

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