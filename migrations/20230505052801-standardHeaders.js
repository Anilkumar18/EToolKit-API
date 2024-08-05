module.exports = {
  async up(db, client) {
    // TODO write your migration here.
      await db.createCollection('static_excel_files');
      await db.collection('static_excel_files').insertMany(data.standardHeaders);
  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};



const data = {
  "standardHeaders" : [
    {
      "fileName" : "Port Data",
      "headersRows" : ["LoCode", "Date", "Containers", "DryBreakbulk", "DryBulk", "RoRo", "LPGCarriers", "LNGCarriers", "WetBulk", "OtherMarkets", "OffshoreRigs", "SupportingVessels", "Passenger", "Fishing", "Pleasure", "Unspecified", "Year", "Week", "MedianDaysAnchor", "MedianDaysPort"],
      "isActive": true,
      "isDeleted": false,
      "uniqueHeaders" : [],
      "headersTypes" : [],
      "isSystemFile" : true
    },
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
      "fileName" : "Port Comparison Types",
      "headersRows" : ["Name"],
      "isActive": true,
      "isDeleted": false,
      "uniqueHeaders" : [],
      "headersTypes" : [],
      "isSystemFile" : true
    },
    {
      "fileName" : "LTL Rates",
      "headersRows" : ["SiteName", "StateCode", "Class", "5C", "1K", "2K", "5K", "10K", "20K", "30K", "40K", "UNL"],
      "isActive": true,
      "isDeleted": false,
      "uniqueHeaders" : [],
      "headersTypes" : [],
      "isSystemFile" : true
    },
    {
      "fileName" : "Mileage",
      "headersRows" : ["SiteName", "StateCode", "From", "To", "Mileage"],
      "isActive": true,
      "isDeleted": false,
      "uniqueHeaders" : [],
      "headersTypes" : [],
      "isSystemFile" : true
    },
    {
      "fileName" : "Parcel Rates",
      "headersRows" : ["Weight", "Zone1", "Zone2", "Zone3", "Zone4", "Zone5", "Zone6", "Zone7", "Zone8", "Zone9", "Zone10", "SL1", "SL2", "SL3", "SL4", "SL5", "SL6", "SL7", "SL8", "SL9", "SL10"],
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
      "fileName" : "Service Level Types",
      "headersRows" : ["Name", "Number", "DisplayName", "Type"],
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
    },
    {
      "fileName" : "States",
      "headersRows" : ["Region", "StateName", "StateCode", "PostalCode", "Population", "PopulationPercent"],
      "isActive": true,
      "isDeleted": false,
      "uniqueHeaders" : [],
      "headersTypes" : [],
      "isSystemFile" : true
    },
    {
      "fileName" : "Trailer Sizes",
      "headersRows" : ["Trailer", "Type", "Length", "Height", "Width", "Cube", "UtilizationPercent", "Utilization"],
      "isActive": true,
      "isDeleted": false,
      "uniqueHeaders" : [],
      "headersTypes" : [],
      "isSystemFile" : true
    },
    {
      "fileName" : "Weight Units",
      "headersRows" : ["Name", "WeightNumber"],
      "isActive": true,
      "isDeleted": false,
      "uniqueHeaders" : [],
      "headersTypes" : [],
      "isSystemFile" : true
    },
    {
      "fileName" : "Zones",
      "headersRows" : ["Name"],
      "isActive": true,
      "isDeleted": false,
      "uniqueHeaders" : [],
      "headersTypes" : [],
      "isSystemFile" : true
    }
  ]
}





