const { MongoClient, ObjectID } = require('mongodb');

module.exports = {

    async up(db, client) {
        await db.createCollection('variables');
        await db.collection('variables').insertMany(data.variables);
    }
};


const data = {
    "variables": [
        {
            "_id": ObjectID("6321672d9bb1f416a8726b97"),
            "name": "overAllRevenue",
            "label": "Organization's Overall Revenue",
            "type": "Organization",
            "valueType": "Number",
            "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "createdAt": new Date(),
            "updatedAt": new Date(),
            "isActive": true,
            "isDeleted": false
        },
        {
            "_id": ObjectID("6321678a9bb1f416a8726b9b"),
            "name": "eCommerceRevenuePercentage",
            "label": "Organization's Revenue Percentage From E-Commerce",
            "type": "Organization",
            "valueType": "Number",
            "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "createdAt": new Date(),
            "updatedAt": new Date(),
            "isActive": true,
            "isDeleted": false
        },
        {
            "_id": ObjectID("632167bf9bb1f416a8726b9d"),
            "name": "traditionalRetailRevenuePercentage",
            "label": "Organization's Traditional Retail Revenue Percentage",
            "type": "Organization",
            "valueType": "Number",
            "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "createdAt": new Date(),
            "updatedAt": new Date(),
            "isActive": true,
            "isDeleted": false
        },
        {
            "_id": ObjectID("632167dc9bb1f416a8726b9f"),
            "name": "eCommerceUnit",
            "label": "Organization's E-Commerce Units",
            "type": "Organization",
            "valueType": "Number",
            "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "createdAt": new Date(),
            "updatedAt": new Date(),
            "isActive": true,
            "isDeleted": false
        },
        {
            "_id": ObjectID("632167f69bb1f416a8726ba1"),
            "name": "traditionalRetailUnit",
            "label": "Organization's Traditional Retail Units",
            "type": "Organization",
            "valueType": "Number",
            "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "createdAt": new Date(),
            "updatedAt": new Date(),
            "isActive": true,
            "isDeleted": false
        },
        {
            "_id": ObjectID("639323cd7aecdf61658f403f"),
            "name": "selectedProducts",
            "label": "Selected Products",
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
            "_id": ObjectID("639323cd7aecdf61658f4040"),
            "name": "selectedStates",
            "label": "Selected States",
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
            "_id": ObjectID("639323cd7aecdf61658f4041"),
            "name": "selectedSites",
            "label": "Selected Sites",
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
            "_id": ObjectID("639323cd7aecdf61658f403e"),
            "name": "selectedServiceLevels",
            "label": "Selected Service Levels",
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
            "_id": ObjectID("639323cd7aecdf61658f4042"),
            "name": "eCommerceRevenue",
            "label": "Ecommerce Revenue",
            "type": "LoopVariable",
            "valueType": "Number",
            "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "createdAt": new Date(),
            "updatedAt": new Date(),
            "isActive": true,
            "isDeleted": false
        },
        {
            "_id": ObjectID("639323cd7aecdf61658f4045"),
            "name": "ltlRevenue",
            "label": "LTL Volume",
            "type": "LoopVariable",
            "valueType": "Number",
            "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "createdAt": new Date(),
            "updatedAt": new Date(),
            "isActive": true,
            "isDeleted": false
        },
        {
            "_id": ObjectID("639323cd7aecdf61658f4049"),
            "name": "tlRevenue",
            "label": "TL Volume",
            "type": "LoopVariable",
            "valueType": "Number",
            "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "createdAt": new Date(),
            "updatedAt": new Date(),
            "isActive": true,
            "isDeleted": false
        },
        {
            "_id": ObjectID("639323cd7aecdf61658f404c"),
            "name": "fleetRevenue",
            "label": "Fleet Volume",
            "type": "LoopVariable",
            "valueType": "Number",
            "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "createdAt": new Date(),
            "updatedAt": new Date(),
            "isActive": true,
            "isDeleted": false
        },
        {
            "_id": ObjectID("6437d859e0915666545570cd"),
            "name": "ParcelRaterPercentage",
            "label": "Parcel Rater Percentage",
            "type": "LoopVariable",
            "valueType": "Number",
            "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "createdAt": new Date(),
            "updatedAt": new Date(),
            "isActive": true,
            "isDeleted": false
        },
        {
            "_id": ObjectID("6437d877e0915666545570ce"),
            "name": "LTLRaterPercentage",
            "label": "LTL Rater Percentage",
            "type": "LoopVariable",
            "valueType": "Number",
            "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "createdAt": new Date(),
            "updatedAt": new Date(),
            "isActive": true,
            "isDeleted": false
        },
        {
            "_id": ObjectID("6437d88ee0915666545570d1"),
            "name": "TLRaterPercentage",
            "label": "TL Rater Percentage",
            "type": "LoopVariable",
            "valueType": "Number",
            "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "createdAt": new Date(),
            "updatedAt": new Date(),
            "isActive": true,
            "isDeleted": false
        },
        {
            "_id": ObjectID("6437d89ce0915666545570d2"),
            "name": "PrivateFleetRaterPercentage",
            "label": "Private Fleet Rater Percentage",
            "type": "LoopVariable",
            "valueType": "Number",
            "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "createdAt": new Date(),
            "updatedAt": new Date(),
            "isActive": true,
            "isDeleted": false
        },
        {
            "_id": ObjectID("639dbd884f1d3b07e89deb47"),
            "name": "selectedPorts",
            "label": "Selected Ports",
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
            "_id": ObjectID("644b9899fc3ea25611ef5def"),
            "name": "selectedDate",
            "label": "Selected Date",
            "type": "LoopVariable",
            "valueType": "String",
            "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "createdAt": new Date(),
            "updatedAt": new Date(),
            "isActive": true,
            "isDeleted": false
        },
        {
            "_id": ObjectID("644b98b0fc3ea25611ef5df0"),
            "name": "comparisonDate",
            "label": "Selected Comparison Date",
            "type": "LoopVariable",
            "valueType": "String",
            "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
            "createdAt": new Date(),
            "updatedAt": new Date(),
            "isActive": true,
            "isDeleted": false
        }
    ]
}