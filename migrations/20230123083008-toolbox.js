const { MongoClient, ObjectID } = require('mongodb');

module.exports = {
  async up(db, client) {
      await db.createCollection('topics');
      await db.collection('topics').insertOne(data.topic);
  }
};


const data = {
  topic : {
    "_id" : ObjectID("63b3d6ba268f2803bd84ba7b"),
    "isActive" : true,
    "name" : "General Toolbox",
    "type" : "topic",
    "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
    "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
    "createdAt": new Date(),
    "updatedAt": new Date(),
  }
}
