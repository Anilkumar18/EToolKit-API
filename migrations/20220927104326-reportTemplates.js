const { MongoClient, ObjectID } = require('mongodb');

module.exports = {
  async up(db, client) {
    await db.createCollection('report_templates');
    await db.collection('report_templates').insertMany(data.report_templates);
  }
};

const data = {
  "report_templates": [
    {
      "_id": ObjectID("63725b38e253519bf28bb2ad"),
      "name": "Netwrok Computation Template",
      "slug": "networkComputation",
      "displayLabel" : "Netwrok Computation Template",
      "isActive": true,
      "isDeleted": false
    },
    {
      "_id": ObjectID("63725b87fd73349d253a700a"),
      "name": "Port Analysis Template",
      "slug": "portAnalysis",
      "displayLabel" : "Port Analysis Template",
      "isActive": true,
      "isDeleted": false
    },
    {
      "_id": ObjectID("63bd4ad852c814eec72dcc8e"),
      "name": "Default Template",
      "slug": "default",
      "displayLabel" : "Default Template",
      "isActive": true,
      "isDeleted": false
    }
  ]
}