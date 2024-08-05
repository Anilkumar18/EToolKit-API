const {
  MongoClient,
  ObjectID
} = require('mongodb');

module.exports = {
  async up(db, client) {
    // TODO write your migration here.
    // await db.createCollection('static_excel_files');
    await db.collection('static_excel_files').insertMany(data.standardHeaders);
    // await db.createCollection('variables');
    await db.collection('variables').insertMany(data.variables);
    await db.collection("preDefinedLogics").insertMany(data.preDefinedLogics);
    await db.collection('loop_types').insertMany(data.loop_types);
    await db.collection('report_templates').insertMany(data.reportTemplates)
    for(const data of updateData.standardHeaders) {
      await db.collection('static_excel_files').updateOne({ fileName : data.fileName }, {$set : {headersRows : data.headersRows}});
    }
  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};


const updateData = {
  "standardHeaders" : [
    {
      "fileName" : "Port Regions",
      "headersRows" : ["Region", "Country", "PortName", "LoCode", "Latitude", "Longitude", "sqft", "LaborCost", "PortScorecard"],
      "isActive": true,
      "isDeleted": false,
      "uniqueHeaders" : [],
      "headersTypes" : [],
      "isSystemFile" : true
    },
    {
      "fileName" : "Products",
      "headersRows" : ["Category", "Name", "UOM", "L", "W", "H", "PCuFt", "ActualWeight", "FrtClass", "RetailPrice", "DimWt", "CalcWt", "UnitsPerContainer", "PIPercent"],
      "isActive": true,
      "isDeleted": false,
      "uniqueHeaders" : [],
      "headersTypes" : [],
      "isSystemFile" : true
    },
    {
      "fileName" : "Sites",
      "headersRows" : ["USRegion", "SiteName", "StateCode", "Latitude", "Longitude", "ALZone", "AKZone", "AZZone", "ARZone", "CAZone", "COZone", "CTZone", "DEZone", "FLZone", "GAZone", "HIZone", "IDZone", "ILZone", "INZone", "IAZone", "KSZone", "KYZone", "LAZone", "MEZone", "MDZone", "MAZone", "MIZone", "MNZone", "MSZone", "MOZone", "MTZone", "NEZone", "NVZone", "NHZone", "NJZone", "NMZone", "NYZone", "NCZone", "NDZone", "OHZone", "OKZone", "ORZone", "PAZone", "RIZone", "SCZone", "CDZone", "TNZone", "TXZone", "UTZone", "VTZone", "VAZone", "WAZone", "WVZone", "WIZone", "WYZone"],
      "isActive": true,
      "isDeleted": false,
      "uniqueHeaders" : [],
      "headersTypes" : [],
      "isSystemFile" : true
    }
  ]
};

const data = {
  "reportTemplates" : [
    {
      "_id": ObjectID("64a7bdd587da2e1596d5f32a"),
      "name": "Nearshore Template",
      "slug": "nearshoreTemplate",
      "displayLabel" : "Nearshore Solution",
      "isActive": true,
      "isDeleted": false
    }
  ],
  "standardHeaders": [
    // {
    //   "fileName": "Countries",
    //   "headersRows": ["Country"],
    //   "isActive": true,
    //   "isDeleted": false,
    //   "uniqueHeaders": [],
    //   "headersTypes": [],
    //   "isSystemFile": true
    // },
    // {
    //   "fileName": "Sites(Nearshore)",
    //   "headersRows": ["Sites"],
    //   "isActive": true,
    //   "isDeleted": false,
    //   "uniqueHeaders": [],
    //   "headersTypes": [],
    //   "isSystemFile": true
    // },
    // {
    //   "fileName": "Products(Nearshore)",
    //   "headersRows": ["Category", "Name", "UOM", "L", "W", "H", "PCuFt", "ActualWeight", "FrtClass", "RetailPrice", "DimWt", "CalcWt", "UnitsPerContainer", "PIPercent"],
    //   "isActive": true,
    //   "isDeleted": false,
    //   "uniqueHeaders": [],
    //   "headersTypes": [],
    //   "isSystemFile": true
    // },
    // {
    //   "fileName": "Ports(Nearshore)",
    //   "headersRows": ["Ports"],
    //   "isActive": true,
    //   "isDeleted": false,
    //   "uniqueHeaders": [],
    //   "headersTypes": [],
    //   "isSystemFile": true
    // },
    // {
    //   "fileName": "Facility Costs",
    //   "headersRows": ["Country", "SqFt", "LabourRate"],
    //   "isActive": true,
    //   "isDeleted": false,
    //   "uniqueHeaders": [],
    //   "headersTypes": [],
    //   "isSystemFile": true
    // },
    {
      "fileName": "Container Rates And Lead Time",
      "headersRows": ["LaneCode", "OriginRegion", "OriginCountry", "OriginPortName", "PortOriginCode", "DestinationRegion", "DestinationCountry", "DestinationPortName", "PortDestinationCode", "LeadTime", "ContainerRate"],
      "isActive": true,
      "isDeleted": false,
      "uniqueHeaders": [],
      "headersTypes": [],
      "isSystemFile": true
    },
    {
      "fileName": "Container Rates And Lead Time For Dray",
      "headersRows": ["LaneCode", "OriginRegion", "OriginCountry", "OriginPortName", "PortOriginCode", "DestinationRegion", "DestinationCountry", "DestinationPortName", "PortDestinationCode", "LeadTime", "ContainerRate"],
      "isActive": true,
      "isDeleted": false,
      "uniqueHeaders": [],
      "headersTypes": [],
      "isSystemFile": true
    }
  ],
  "variables": [{
      "_id": ObjectID("64a7bcb087da2e1596d5f313"),
      "name": "CurrentCountry",
      "label": "Current Manufacturing Country",
      "type": "LoopVariable",
      "valueType": "Array",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
      "isActive": true,
      "isDeleted": false
    },
    {
      "_id": ObjectID("64a7bcc787da2e1596d5f314"),
      "name": "FutureCountry",
      "label": "Future Manufacturing Country",
      "type": "LoopVariable",
      "valueType": "Array",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
      "isActive": true,
      "isDeleted": false
    },
    {
      "_id": ObjectID("64a7bcd487da2e1596d5f315"),
      "name": "CurrentPortOfExport",
      "label": "Current Port Of Export",
      "type": "LoopVariable",
      "valueType": "Array",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
      "isActive": true,
      "isDeleted": false
    },
    {
      "_id": ObjectID("64a7bdd587da2e1596d5f32a"),
      "name": "CurrentPortOfImport",
      "label": "Current Port Of Import",
      "type": "LoopVariable",
      "valueType": "Array",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
      "isActive": true,
      "isDeleted": false
    },
    {
      "_id": ObjectID("64a7bce087da2e1596d5f316"),
      "name": "FuturePortOfExport",
      "label": "Future Port Of Export",
      "type": "LoopVariable",
      "valueType": "Array",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
      "isActive": true,
      "isDeleted": false
    },
    {
      "_id": ObjectID("64a7bdcc87da2e1596d5f329"),
      "name": "FuturePortOfImport",
      "label": "Future Port Of Import",
      "type": "LoopVariable",
      "valueType": "Array",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
      "isActive": true,
      "isDeleted": false
    },
    {
      "_id": ObjectID("64a7bcec87da2e1596d5f317"),
      "name": "Site",
      "label": "Distribution Node",
      "type": "LoopVariable",
      "valueType": "Array",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
      "isActive": true,
      "isDeleted": false
    },
    {
      "_id": ObjectID("64a7bcf787da2e1596d5f318"),
      "name": "LTNet",
      "label": "Net Lead Time",
      "type": "LoopVariable",
      "valueType": "Array",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
      "isActive": true,
      "isDeleted": false
    },
    {
      "_id": ObjectID("64a7bd0187da2e1596d5f319"),
      "name": "ContainerSavings",
      "label": "Container Savings",
      "type": "LoopVariable",
      "valueType": "Array",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
      "isActive": true,
      "isDeleted": false
    },
    {
      "_id": ObjectID("64a7bd0c87da2e1596d5f31a"),
      "name": "DSavings",
      "label": "Distribution Savings",
      "type": "LoopVariable",
      "valueType": "Array",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
      "isActive": true,
      "isDeleted": false
    },
    {
      "_id": ObjectID("64a7bd2187da2e1596d5f31b"),
      "name": "SpaceCost",
      "label": "Space Cost",
      "type": "LoopVariable",
      "valueType": "Array",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
      "isActive": true,
      "isDeleted": false
    },
    {
      "_id": ObjectID("64a7bd3987da2e1596d5f31c"),
      "name": "LaborCost",
      "label": "Labor Cost",
      "type": "LoopVariable",
      "valueType": "Array",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
      "isActive": true,
      "isDeleted": false
    },
    {
      "_id": ObjectID("64a7bd4787da2e1596d5f31d"),
      "name": "FMCost",
      "label": "Future Maintenance Cost",
      "type": "LoopVariable",
      "valueType": "Array",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
      "isActive": true,
      "isDeleted": false
    },
    {
      "_id": ObjectID("64a7bd5287da2e1596d5f31e"),
      "name": "InTransitInv",
      "label": "InTransitInv",
      "type": "LoopVariable",
      "valueType": "Array",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
      "isActive": true,
      "isDeleted": false
    },
    {
      "_id": ObjectID("64a7bd7187da2e1596d5f321"),
      "name": "ManufacturingRelocation",
      "label": "Value Of Manufacturing Relocation",
      "type": "LoopVariable",
      "valueType": "Array",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
      "isActive": true,
      "isDeleted": false
    },
    {
      "_id": ObjectID("64a7bd7c87da2e1596d5f322"),
      "name": "PlantCost",
      "label": "Cost Of Plant Ownership",
      "type": "LoopVariable",
      "valueType": "Array",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
      "isActive": true,
      "isDeleted": false
    },
    {
      "_id": ObjectID("64a7bd8787da2e1596d5f323"),
      "name": "FinalDistributionRelocation",
      "label": "Value Of Final Distribution Relocation",
      "type": "LoopVariable",
      "valueType": "Array",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
      "isActive": true,
      "isDeleted": false
    },
    {
      "_id": ObjectID("64a7bd9187da2e1596d5f324"),
      "name": "TotalOpportunityValue",
      "label": "Total Opportunity Value",
      "type": "LoopVariable",
      "valueType": "Array",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
      "isActive": true,
      "isDeleted": false
    }
  ],
  "preDefinedLogics": [{
    "_id": ObjectID("64a7bd5c87da2e1596d5f31f"),
    "logic": "nearshore",
    "description": "nearshore summary",
    "label": "nearshore summary",
    "isDeleted": false,
    "isActive": true,
    "isDecisionTreeAssigned": false,
    "variableId": [
      ObjectID("64a7bcb087da2e1596d5f313"),
      ObjectID("64a7bcc787da2e1596d5f314"),
      ObjectID("64a7bcd487da2e1596d5f315"),
      ObjectID("64a7bce087da2e1596d5f316"),
      ObjectID("64a7bcec87da2e1596d5f317"),
      ObjectID("64a7bcf787da2e1596d5f318"),
      ObjectID("64a7bd0187da2e1596d5f319"),
      ObjectID("64a7bd0c87da2e1596d5f31a"),
      ObjectID("64a7bd2187da2e1596d5f31b"),
      ObjectID("64a7bd3987da2e1596d5f31c"),
      ObjectID("64a7bd4787da2e1596d5f31d"),
      ObjectID("64a7bd5287da2e1596d5f31e"),
      ObjectID("64a7bd7187da2e1596d5f321"),
      ObjectID("64a7bd7c87da2e1596d5f322"),
      ObjectID("64a7bd8787da2e1596d5f323"),
      ObjectID("64a7bd9187da2e1596d5f324"),
      ObjectID("64a7bdcc87da2e1596d5f329"),
      ObjectID("64a7bdd587da2e1596d5f32a")
    ],
    "createdAt": new Date(),
    "updatedAt": new Date()
  }],
  "loop_types": [{
    "_id": ObjectID("64a7bd6687da2e1596d5f320"),
    "name": "Nearshore Loop",
    "slug": "nearshore",
    "variables": [{
        "variableId": ObjectID("64a7bcb087da2e1596d5f313"),
        "type": "predefinedLogicLoop"
      },
      {
        "variableId": ObjectID("64a7bcc787da2e1596d5f314"),
        "type": "predefinedLogicLoop"
      },
      {
        "variableId": ObjectID("64a7bcd487da2e1596d5f315"),
        "type": "predefinedLogicLoop"
      },
      {
        "variableId": ObjectID("64a7bce087da2e1596d5f316"),
        "type": "predefinedLogicLoop"
      },
      {
        "variableId": ObjectID("64a7bdcc87da2e1596d5f329"),
        "type": "predefinedLogicLoop"
      },
      {
        "variableId": ObjectID("64a7bdd587da2e1596d5f32a"),
        "type": "predefinedLogicLoop"
      },
      {
        "variableId": ObjectID("64a7bcec87da2e1596d5f317"),
        "type": "predefinedLogicLoop"
      },
      {
        "variableId": ObjectID("64a7bcf787da2e1596d5f318"),
        "type": "loop"
      },
      {
        "variableId": ObjectID("64a7bd0187da2e1596d5f319"),
        "type": "loop"
      },
      {
        "variableId": ObjectID("64a7bd0c87da2e1596d5f31a"),
        "type": "loop"
      },
      {
        "variableId": ObjectID("64a7bd2187da2e1596d5f31b"),
        "type": "loop"
      },
      {
        "variableId": ObjectID("64a7bd3987da2e1596d5f31c"),
        "type": "loop"
      },
      {
        "variableId": ObjectID("64a7bd4787da2e1596d5f31d"),
        "type": "loop"
      },
      {
        "variableId": ObjectID("64a7bd5287da2e1596d5f31e"),
        "type": "loop"
      },
      {
        "variableId": ObjectID("64a7bd7187da2e1596d5f321"),
        "type": "loop"
      },
      {
        "variableId": ObjectID("64a7bd7c87da2e1596d5f322"),
        "type": "loop"
      },
      {
        "variableId": ObjectID("64a7bd8787da2e1596d5f323"),
        "type": "loop"
      },
      {
        "variableId": ObjectID("64a7bd9187da2e1596d5f324"),
        "type": "loop"
      }
    ],
    "isActive": true,
    "isDeleted": false
  }]
}