const { MongoClient, ObjectID } = require('mongodb');

module.exports = {
  async up(db, client) {
    await db.createCollection("preDefinedLogics");
    await db.collection("preDefinedLogics").insertMany(data.preDefinedLogics);
  }
};


const data = {
  "preDefinedLogics": [
    {
      "_id": ObjectID("6343f7de39ab0f9ba057e503"),
      "logic": "parcelRater",
      "label": "Parcel Rater (Network Computation)",
      "isDeleted": false,
      "isActive": true,
      "isDecisionTreeAssigned": false,
      "variableId": [
        ObjectID("639323cd7aecdf61658f403f"),
        ObjectID("639323cd7aecdf61658f4040"),
        ObjectID("639323cd7aecdf61658f4041"),
        ObjectID("639323cd7aecdf61658f403e"),
        ObjectID("639323cd7aecdf61658f4042"),
        ObjectID("6437d859e0915666545570cd")
      ],
      "createdAt": new Date(),
      "updatedAt": new Date()
    },
    {
      "_id": ObjectID("6343ff9215ec64c8e8793fb3"),
      "logic": "ltlRater",
      "label": "LTL Rater (Network Computation)",
      "isDeleted": false,
      "isActive": true,
      "isDecisionTreeAssigned": false,
      "variableId": [
        ObjectID("639323cd7aecdf61658f403f"),
        ObjectID("639323cd7aecdf61658f4040"),
        ObjectID("639323cd7aecdf61658f4041"),
        ObjectID("639323cd7aecdf61658f403e"),
        ObjectID("639323cd7aecdf61658f4045"),
        ObjectID("6437d877e0915666545570ce")
      ],
      "createdAt": new Date(),
      "updatedAt": new Date()
    },
    {
      "_id": ObjectID("6344059915ec64c8e8793fb7"),
      "logic": "tlRater",
      "label": "TL Rater (Network Computation)",
      "isDeleted": false,
      "isActive": true,
      "isDecisionTreeAssigned": false,
      "variableId": [
        ObjectID("639323cd7aecdf61658f403f"),
        ObjectID("639323cd7aecdf61658f4040"),
        ObjectID("639323cd7aecdf61658f4041"),
        ObjectID("639323cd7aecdf61658f403e"),
        ObjectID("639323cd7aecdf61658f4049"),
        ObjectID("6437d88ee0915666545570d1")
      ],
      "createdAt": new Date(),
      "updatedAt": new Date()
    },
    {
      "_id": ObjectID("6344067315ec64c8e8793fbe"),
      "logic": "fleetRater",
      "label": "Fleet Rater (Network Computation)",
      "isDeleted": false,
      "isActive": true,
      "isDecisionTreeAssigned": false,
      "variableId": [
        ObjectID("639323cd7aecdf61658f403f"),
        ObjectID("639323cd7aecdf61658f4040"),
        ObjectID("639323cd7aecdf61658f4041"),
        ObjectID("639323cd7aecdf61658f403e"),
        ObjectID("639323cd7aecdf61658f404c"),
        ObjectID("6437d89ce0915666545570d2")
      ],
      "createdAt": new Date(),
      "updatedAt": new Date()
    },
    {
      "_id": ObjectID("639c3cfa70267b1208318c4b"),
      "logic": "portRater",
      "description": "Port Rater (Port Analysis)",
      "label": "Port Rater (Port Analysis)",
      "isDeleted": false,
      "isActive": true,
      "isDecisionTreeAssigned": false,
      "variableId": [
        ObjectID("639dbd884f1d3b07e89deb47"),
        ObjectID("63a543e8ee53a542070788e9"),
        ObjectID("644b9899fc3ea25611ef5def")
      ],
      "createdAt": new Date(),
      "updatedAt": new Date()
    },
    {
      "_id": ObjectID("644b9978fc3ea25611ef5df1"),
      "logic": "portRaterWithComparisonDate",
      "description": "Port Rater With Custom(Comparison) Date Selection(Port Analysis)",
      "label": "Port Rater With Custom(Comparison) Date Selection(Port Analysis)",
      "isDeleted": false,
      "isActive": true,
      "isDecisionTreeAssigned": false,
      "variableId": [
        ObjectID("639dbd884f1d3b07e89deb47"),
        ObjectID("644b9899fc3ea25611ef5def"),
        ObjectID("644b98b0fc3ea25611ef5df0")
      ],
      "createdAt": new Date(),
      "updatedAt": new Date()
    }
  ]
}