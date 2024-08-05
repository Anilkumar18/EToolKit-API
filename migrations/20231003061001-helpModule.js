const {
  MongoClient,
  ObjectID
} = require('mongodb');

module.exports = {
  async up(db, client) {
    // TODO write your migration here.
    // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});
    await db.createCollection('helpModules');
    await db.collection('helpModules').insertMany(data.helpModules);
  },

  async down(db, client) {
    // TODO write the statements to rollback your migration (if possible)
    // Example:
    // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: false}});
  }
};

const data = {
  "helpModules": [
    {
      "_id": ObjectID("6390472e9b038b80c3c0e4fe"),
      pageName: "ToolboxSection",
      label: "Toolbox Section",
      "fileName": "",
      "fileUrl": "",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
    },
    {
      "_id": ObjectID("63f5dd8b02b6ba31a82536cb"),
      pageName: "ToolBoxAddUpdateSection", label: "ToolBox Add Update Section",
      "fileName": "",
      "fileUrl": "",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
    },
    {
      "_id": ObjectID("63b3c82b268f2803bd847b43"),
      pageName: "ToolBoxDesignStudioSection",
      label: "ToolBox Design Studio Section",
      "fileName": "",
      "fileUrl": "",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
    },
    {
      "_id": ObjectID("63b3c82b268f2803bd847b44"),
      pageName: "UserSection", label: "User Section",
      "fileName": "",
      "fileUrl": "",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
    },
    {
      "_id": ObjectID("63b3c82b268f2803bd847b45"),
      pageName: "OrganizationListSection", label: "Organization List Section",
      "fileName": "",
      "fileUrl": "",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
    },
    {
      "_id": ObjectID("63b3c82b268f2803bd847b46"),
      pageName: "OrganizationAddOrUpdateSection",
      label: "Organization Add Or Update Section",
      "fileName": "",
      "fileUrl": "",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
    },
    {
      "_id": ObjectID("63b3c82b268f2803bd847b47"),
      pageName: "PredefindLogicListSection",
      label: "PredefindLogic List Section",
      "fileName": "",
      "fileUrl": "",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
    },
    {
      "_id": ObjectID("63b3c82b268f2803bd847b48"),
      pageName: "PredefindProcessDesignStudioSection",
      label: "Predefind Process Design Studio Section",
      "fileName": "",
      "fileUrl": "",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
    },
    {
      "_id": ObjectID("63b3c82b268f2803bd847b49"),
      pageName: "FileUploadListAddUpdateSection",
      label: "FileUpload List Add Update Section",
      "fileName": "",
      "fileUrl": "",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
    },
    {
      "_id": ObjectID("63b3c82b268f2803bd847b4a"),
      pageName: "ReportTemplateListSection",
      label: "Report Template List Section",
      "fileName": "",
      "fileUrl": "",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
    },{
      "_id": ObjectID("33b3c82b268f2803bd847b4a"),
      pageName: "UserToolBoxSection",
      label: "User Tool Box List Section",
      "fileName": "",
      "fileUrl": "",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
    },{
      "_id": ObjectID("43b3c82b268f2803bd847b4a"),
      pageName: "UserToolBoxSolutionSection",
      label: "User Tool Box Solution Section",
      "fileName": "",
      "fileUrl": "",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
    },{
      "_id": ObjectID("53b3c82b268f2803bd847b4a"),
      pageName: "UserTraversalSection",
      label: "User Traversal Section",
      "fileName": "",
      "fileUrl": "",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
    },{
      "_id": ObjectID("73b3c82b268f2803bd847b4a"),
      pageName: "UserHistoryListSection",
      label: "User History List Section",
      "fileName": "",
      "fileUrl": "",
      "createdBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "updatedBy": ObjectID("62a6fcb1dfa3812f685be1bc"),
      "createdAt": new Date(),
      "updatedAt": new Date(),
    },
  ]
}
