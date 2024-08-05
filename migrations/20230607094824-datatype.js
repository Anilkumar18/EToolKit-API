module.exports = {
  async up(db, client) {
    // TODO write your migration here.
      await db.createCollection('dataTypes');
      await db.collection('dataTypes').insertMany(data.dataTypes);
  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};



const data = {
  "dataTypes" : [
    {
      "dataType" : "Number",
      "isActive": true,
      "isDeleted": false,
    },
    {
      "dataType" : "String",
      "isActive": true,
      "isDeleted": false
    },
    {
      "dataType" : "Date",
      "isActive": true,
      "isDeleted": false
    }
  ]
};