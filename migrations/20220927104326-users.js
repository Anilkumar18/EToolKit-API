const { MongoClient, ObjectID } = require('mongodb');

module.exports = {
  async up(db, client) {
    await db.createCollection('users');
    await db.collection('users').insertOne(data.user);
  }
};

const data = {
  "user": {
    "_id": ObjectID("62a6fcb1dfa3812f685be1bc"),
    firstName: 'Intech',
    lastName: 'Solution',
    email: 'intech@intech.com',
    password: '$2a$10$Gbo2Xhkn9NB3aa5064VFSekjrVcxybSTlDFGqmSeGliefeb/coH3e',   // intech@1234
    userName: '',
    userRole: [],
    profilePicture: '',
    profileThumbnail: '',
    otpVerificationInfo: null,
    emailVerificationToken: '',
    emailVerificationExpireTime: null,
    resetPasswordToken: '',
    resetPasswordExpireTime: null,
    createdBy: null,
    updatedBy: null,
    isRegistered: false,
    userSignupType: 'byRegistration',
    loginWith: '',
    isActiveUser: false,
    isVerifiedUser: false,
    isDeletedUser: false,
    isAdmin: true
  }
}