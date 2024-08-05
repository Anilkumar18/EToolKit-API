import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";
import aggregatePaginate from "mongoose-aggregate-paginate-v2";

const OtpVerificationInfoSchema = new mongoose.Schema({
  otpFor: { type: String, enum: ["signup", "resetPassword"] },
  otpCode: { type: Number },
  createdOn: { type: Date },
}, { _id: false });

const userSchema = mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "organizations"
  },
  email: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    default: ""
  },
  countryCode: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  userRole: {
    type: Array,        // executive, orgAdmin, superAdmin
    required: true,
  },
  designation: {
    type: String,
    required: true,
  },
  webToken : {
    type: String
  },
  mobileToken : {
    type: String
  },
  password: {
    type: String,
    required: true,
  },
  profilePicture: {
    type: String,
    default: ""
  },
  profileThumbnail: {
    type: String,
    default: ""
  },
  otpVerificationInfo: {
    type: OtpVerificationInfoSchema,
    default: null
  },
  emailVerificationToken: {
    type: String,
    default: ""
  },
  emailVerificationExpireTime: {
    type: Date,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: ""
  },
  resetPasswordExpireTime: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    default: null
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    default: null
  },
  isRegistered: {
    type: Boolean,
    default: false,
  },
  userSignupType: {
    type: String,
    enum: ["byRegistration", "bySocially", "hybrid"],
    default: "byRegistration"
  },
  loginWith: {
    type: String,
    enum: ["", "email", "google", "facebook"],
    default: ""
  },
  isActiveUser: {
    type: Boolean,// false=inactive true=active
    default: false
  },
  isVerifiedUser: {
    type: Boolean,// false=not verified true=verified
    default: false
  },
  isDeletedUser: {
    type: Boolean,// false=inactive true=active
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
}, {
  collection: "users",
});

userSchema.plugin(timestamps);
userSchema.plugin(aggregatePaginate);

const UsersModel = mongoose.model("users", userSchema);


export default UsersModel;