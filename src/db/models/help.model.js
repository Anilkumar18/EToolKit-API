import mongoose from "mongoose";
import timestamps from "mongoose-timestamp";

const helpModuleSchema = mongoose.Schema(
  {
    label: {
      type: String,
    },
    pageName: {
      type: String,
    },
    fileName: {
      type: String,
    },
    fileUrl: {
      type: String,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "questions"
  },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
  },
  {
    collection: "helpModules",
  }
);

helpModuleSchema.plugin(timestamps);

const helpModuleModel = mongoose.model("helpModules", helpModuleSchema);

export default helpModuleModel;
