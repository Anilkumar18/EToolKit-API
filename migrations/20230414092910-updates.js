// const { MongoClient, ObjectID } = require('mongodb');

module.exports = {
  async up(db, client) {
//     await db.collection('variables').insertMany(data.variables);
//     for(const logicData of Logicdata.preDefinedLogics) {
//       await db.collection("preDefinedLogics").updateOne({_id : logicData._id}, {variableId : logicData.variableId});
    // }
//     for(const loopData of loopdata.loop_types) {
//       await db.collection("loop_types").updateOne({_id : loopData._id}, {variables : loopData.variables});
//     }
  },

  async down(db, client) {
//     // TODO write the statements to rollback your migration (if possible)
//     // Example:
//     // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};


// const loopdata = {
//   "loop_types": [
//     {
//       "_id": ObjectID("6390472e9b038b80c3c0e4fe"),
//       "name": "Parcel Rater Loop",
//       "slug": "parcelRater",
//       "variables": [
//         {
//           "variableId": ObjectID("639323cd7aecdf61658f403f"),
//           "type": "predefinedLogicLoop"
//         },
//         {
//           "variableId": ObjectID("639323cd7aecdf61658f4040"),
//           "type": "predefinedLogicLoop"
//         },
//         {
//           "variableId": ObjectID("639323cd7aecdf61658f4041"),
//           "type": "predefinedLogicLoop"
//         },
//         {
//           "variableId": ObjectID("639323cd7aecdf61658f403e"),
//           "type": "predefinedLogicLoop"
//         },
//         {
//           "variableId": ObjectID("639323cd7aecdf61658f4042"),
//           "type": "loop"
//         },
//         {
//           "variableId": ObjectID("6437d859e0915666545570cd"),
//           "type": "loop"
//         }
//       ],
//       "isActive": true,
//       "isDeleted": false
//     },
//     {
//       "_id": ObjectID("63904da59ead46847af48f68"),
//       "name": "LTL Rater Loop",
//       "slug": "ltlRater",
//       "variables": [
//         {
//           "variableId": ObjectID("639323cd7aecdf61658f403f"),
//           "type": "predefinedLogicLoop"
//         },
//         {
//           "variableId": ObjectID("639323cd7aecdf61658f4040"),
//           "type": "predefinedLogicLoop"
//         },
//         {
//           "variableId": ObjectID("639323cd7aecdf61658f4041"),
//           "type": "predefinedLogicLoop"
//         },
//         {
//           "variableId": ObjectID("639323cd7aecdf61658f403e"),
//           "type": "predefinedLogicLoop"
//         },
//         {
//           "variableId": ObjectID("639323cd7aecdf61658f4045"),
//           "type": "loop"
//         },
//         {
//           "variableId": ObjectID("6437d877e0915666545570ce"),
//           "type": "loop"
//         }
//       ],
//       "isActive": true,
//       "isDeleted": false
//     },
//     {
//       "_id": ObjectID("63904daeceaec284adbd9b5e"),
//       "name": "TL Rater Loop",
//       "slug": "tlRater",
//       "variables": [
//         {
//           "variableId": ObjectID("639323cd7aecdf61658f403f"),
//           "type": "predefinedLogicLoop"
//         },
//         {
//           "variableId": ObjectID("639323cd7aecdf61658f4040"),
//           "type": "predefinedLogicLoop"
//         },
//         {
//           "variableId": ObjectID("639323cd7aecdf61658f4041"),
//           "type": "predefinedLogicLoop"
//         },
//         {
//           "variableId": ObjectID("639323cd7aecdf61658f403e"),
//           "type": "predefinedLogicLoop"
//         },
//         {
//           "variableId": ObjectID("639323cd7aecdf61658f4049"),
//           "type": "loop"
//         },
//         {
//           "variableId": ObjectID("6437d88ee0915666545570d1"),
//           "type": "loop"
//         }
//       ],
//       "isActive": true,
//       "isDeleted": false
//     },
//     {
//       "_id": ObjectID("63904db6eeb04684d12d3a54"),
//       "name": "Fleet Rater Loop",
//       "slug": "fleetRater",
//       "variables": [
//         {
//           "variableId": ObjectID("639323cd7aecdf61658f403f"),
//           "type": "predefinedLogicLoop"
//         },
//         {
//           "variableId": ObjectID("639323cd7aecdf61658f4040"),
//           "type": "predefinedLogicLoop"
//         },
//         {
//           "variableId": ObjectID("639323cd7aecdf61658f4041"),
//           "type": "predefinedLogicLoop"
//         },
//         {
//           "variableId": ObjectID("639323cd7aecdf61658f403e"),
//           "type": "predefinedLogicLoop"
//         },
//         {
//           "variableId": ObjectID("639323cd7aecdf61658f404c"),
//           "type": "loop"
//         },
//         {
//           "variableId": ObjectID("6437d89ce0915666545570d2"),
//           "type": "loop"
//         }
//       ],
//       "isActive": true,
//       "isDeleted": false
//     }
//   ]
// }



// const data = {
//   "variables": [
//       {
//           "_id": ObjectID("6437d859e0915666545570cd"),
//           "name": "ParcelRaterPercentage",
//           "label": "Parcel Rater Percentage",
//           "type": "LoopVariable",
//           "valueType": "Number",
//           "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
//           "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
//           "createdAt": new Date(),
//           "updatedAt": new Date(),
//           "isActive": true,
//           "isDeleted": false
//       },
//       {
//           "_id": ObjectID("6437d877e0915666545570ce"),
//           "name": "LTLRaterPercentage",
//           "label": "LTL Rater Percentage",
//           "type": "LoopVariable",
//           "valueType": "Number",
//           "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
//           "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
//           "createdAt": new Date(),
//           "updatedAt": new Date(),
//           "isActive": true,
//           "isDeleted": false
//       },
//       {
//           "_id": ObjectID("6437d88ee0915666545570d1"),
//           "name": "TLRaterPercentage",
//           "label": "TL Rater Percentage",
//           "type": "LoopVariable",
//           "valueType": "Number",
//           "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
//           "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
//           "createdAt": new Date(),
//           "updatedAt": new Date(),
//           "isActive": true,
//           "isDeleted": false
//       },
//       {
//           "_id": ObjectID("6437d89ce0915666545570d2"),
//           "name": "PrivateFleetRaterPercentage",
//           "label": "Private Fleet Rater Percentage",
//           "type": "LoopVariable",
//           "valueType": "Number",
//           "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
//           "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
//           "createdAt": new Date(),
//           "updatedAt": new Date(),
//           "isActive": true,
//           "isDeleted": false
//       }
//   ]
// }


// const Logicdata = {
//   "preDefinedLogics": [
//     {
//       "_id": ObjectID("6343f7de39ab0f9ba057e503"),
//       "logic": "parcelRater",
//       "label": "Parcel Rater (Network Computation)",
//       "isDeleted": false,
//       "isActive": true,
//       "isDecisionTreeAssigned": false,
//       "variableId": [
//         ObjectID("639323cd7aecdf61658f403f"),
//         ObjectID("639323cd7aecdf61658f4040"),
//         ObjectID("639323cd7aecdf61658f4041"),
//         ObjectID("639323cd7aecdf61658f403e"),
//         ObjectID("639323cd7aecdf61658f4042"),
//         ObjectID("6437d859e0915666545570cd")
//       ],
//       "createdAt": new Date(),
//       "updatedAt": new Date()
//     },
//     {
//       "_id": ObjectID("6343ff9215ec64c8e8793fb3"),
//       "logic": "ltlRater",
//       "label": "LTL Rater (Network Computation)",
//       "isDeleted": false,
//       "isActive": true,
//       "isDecisionTreeAssigned": false,
//       "variableId": [
//         ObjectID("639323cd7aecdf61658f403f"),
//         ObjectID("639323cd7aecdf61658f4040"),
//         ObjectID("639323cd7aecdf61658f4041"),
//         ObjectID("639323cd7aecdf61658f403e"),
//         ObjectID("639323cd7aecdf61658f4045"),
//         ObjectID("6437d877e0915666545570ce")
//       ],
//       "createdAt": new Date(),
//       "updatedAt": new Date()
//     },
//     {
//       "_id": ObjectID("6344059915ec64c8e8793fb7"),
//       "logic": "tlRater",
//       "label": "TL Rater (Network Computation)",
//       "isDeleted": false,
//       "isActive": true,
//       "isDecisionTreeAssigned": false,
//       "variableId": [
//         ObjectID("639323cd7aecdf61658f403f"),
//         ObjectID("639323cd7aecdf61658f4040"),
//         ObjectID("639323cd7aecdf61658f4041"),
//         ObjectID("639323cd7aecdf61658f403e"),
//         ObjectID("639323cd7aecdf61658f4049"),
//         ObjectID("6437d88ee0915666545570d1")
//       ],
//       "createdAt": new Date(),
//       "updatedAt": new Date()
//     },
//     {
//       "_id": ObjectID("6344067315ec64c8e8793fbe"),
//       "logic": "fleetRater",
//       "label": "Fleet Rater (Network Computation)",
//       "isDeleted": false,
//       "isActive": true,
//       "isDecisionTreeAssigned": false,
//       "variableId": [
//         ObjectID("639323cd7aecdf61658f403f"),
//         ObjectID("639323cd7aecdf61658f4040"),
//         ObjectID("639323cd7aecdf61658f4041"),
//         ObjectID("639323cd7aecdf61658f403e"),
//         ObjectID("639323cd7aecdf61658f404c"),
//         ObjectID("6437d89ce0915666545570d2")
//       ],
//       "createdAt": new Date(),
//       "updatedAt": new Date()
//     }
//   ]
// }