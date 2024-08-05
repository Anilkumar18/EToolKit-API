const { MongoClient, ObjectID } = require('mongodb');

module.exports = {
  async up(db, client) {
    await db.createCollection('loop_types');
    await db.collection('loop_types').insertMany(data.loop_types);
  }
};

const data = {
  "loop_types": [
    {
      "_id": ObjectID("6390472e9b038b80c3c0e4fe"),
      "name": "Parcel Rater Loop",
      "slug": "parcelRater",
      "variables": [
        {
          "variableId": ObjectID("639323cd7aecdf61658f403f"),
          "type": "predefinedLogicLoop"
        },
        {
          "variableId": ObjectID("639323cd7aecdf61658f4040"),
          "type": "predefinedLogicLoop"
        },
        {
          "variableId": ObjectID("639323cd7aecdf61658f4041"),
          "type": "predefinedLogicLoop"
        },
        {
          "variableId": ObjectID("639323cd7aecdf61658f403e"),
          "type": "predefinedLogicLoop"
        },
        {
          "variableId": ObjectID("639323cd7aecdf61658f4042"),
          "type": "loop"
        },
        {
          "variableId": ObjectID("6437d859e0915666545570cd"),
          "type": "loop"
        }
      ],
      "isActive": true,
      "isDeleted": false
    },
    {
      "_id": ObjectID("63904da59ead46847af48f68"),
      "name": "LTL Rater Loop",
      "slug": "ltlRater",
      "variables": [
        {
          "variableId": ObjectID("639323cd7aecdf61658f403f"),
          "type": "predefinedLogicLoop"
        },
        {
          "variableId": ObjectID("639323cd7aecdf61658f4040"),
          "type": "predefinedLogicLoop"
        },
        {
          "variableId": ObjectID("639323cd7aecdf61658f4041"),
          "type": "predefinedLogicLoop"
        },
        {
          "variableId": ObjectID("639323cd7aecdf61658f403e"),
          "type": "predefinedLogicLoop"
        },
        {
          "variableId": ObjectID("639323cd7aecdf61658f4045"),
          "type": "loop"
        },
        {
          "variableId": ObjectID("6437d877e0915666545570ce"),
          "type": "loop"
        }
      ],
      "isActive": true,
      "isDeleted": false
    },
    {
      "_id": ObjectID("63904daeceaec284adbd9b5e"),
      "name": "TL Rater Loop",
      "slug": "tlRater",
      "variables": [
        {
          "variableId": ObjectID("639323cd7aecdf61658f403f"),
          "type": "predefinedLogicLoop"
        },
        {
          "variableId": ObjectID("639323cd7aecdf61658f4040"),
          "type": "predefinedLogicLoop"
        },
        {
          "variableId": ObjectID("639323cd7aecdf61658f4041"),
          "type": "predefinedLogicLoop"
        },
        {
          "variableId": ObjectID("639323cd7aecdf61658f403e"),
          "type": "predefinedLogicLoop"
        },
        {
          "variableId": ObjectID("639323cd7aecdf61658f4049"),
          "type": "loop"
        },
        {
          "variableId": ObjectID("6437d88ee0915666545570d1"),
          "type": "loop"
        }
      ],
      "isActive": true,
      "isDeleted": false
    },
    {
      "_id": ObjectID("63904db6eeb04684d12d3a54"),
      "name": "Fleet Rater Loop",
      "slug": "fleetRater",
      "variables": [
        {
          "variableId": ObjectID("639323cd7aecdf61658f403f"),
          "type": "predefinedLogicLoop"
        },
        {
          "variableId": ObjectID("639323cd7aecdf61658f4040"),
          "type": "predefinedLogicLoop"
        },
        {
          "variableId": ObjectID("639323cd7aecdf61658f4041"),
          "type": "predefinedLogicLoop"
        },
        {
          "variableId": ObjectID("639323cd7aecdf61658f403e"),
          "type": "predefinedLogicLoop"
        },
        {
          "variableId": ObjectID("639323cd7aecdf61658f404c"),
          "type": "loop"
        },
        {
          "variableId": ObjectID("6437d89ce0915666545570d2"),
          "type": "loop"
        }
      ],
      "isActive": true,
      "isDeleted": false
    },
    {
      "_id": ObjectID("639dc2305b81940cfdbdf395"),
      "name": "Port Rater Loop",
      "slug": "portRater",
      "variables": [
        {
          "variableId": ObjectID("639dbd884f1d3b07e89deb47"),
          "type": "predefinedLogicLoop"
        },
        {
          "variableId": ObjectID("63a543e8ee53a542070788e9"),
          "type": "predefinedLogicLoop"
        },
        {
          "variableId": ObjectID("644b9899fc3ea25611ef5def"),
          "type": "loop"
        }
      ],
      "isActive": true,
      "isDeleted": false
    },
    {
      "_id": ObjectID("644b9b6bfc3ea25611ef5df2"),
      "name": "Port Rater Loop Having Comparison Date Selection",
      "slug": "portRaterWithComparisonDate",
      "variables": [
        {
          "variableId": ObjectID("639dbd884f1d3b07e89deb47"),
          "type": "predefinedLogicLoop"
        },
        {
          "variableId": ObjectID("644b9899fc3ea25611ef5def"),
          "type": "loop"
        },
        {
          "variableId": ObjectID("644b98b0fc3ea25611ef5df0"),
          "type": "loop"
        }
      ],
      "isActive": true,
      "isDeleted": false
    }
  ]
}