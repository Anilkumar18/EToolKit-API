import { Router } from "express";
const router = Router();
import adminController from "../../controller/admins/admin.controller";
import organizationRoute from "./organization.routes";
import topicRoute from "./topic.routes";
import subTopicRoute from "./subTopic.routes";
import questionRoute from "./question.routes";
import decisionTreeRoute from "./decisionTree.route";
import functionRoute from "./function.routes";
import variableRoute from "./variable.routes";
import userRoute from "./user.routes";
import exceldataRoute from "./excel-data.routes";
import excelDataRoute from "./excelData.routes";
import dashboardRoute from "./dashboard.routes";
import profileRoute from "./profile.routes";
import processRoute from "./process.routes";
import reportTemplateRoute from "./reportTemplate.routes";
import sampleFileRoute from "./sampleFile.routes";
import helpModuleRoute from "./helpModule.routes";

//admin routes
router.post("/create", adminController.create);
router.post("/login", adminController.login);
router.post("/send-otp", adminController.send_otp);
router.post("/reset-password", adminController.reset_password);

//organization routes
router.use("/organization", organizationRoute);

//topic routes
router.use("/topic", topicRoute);

//sub topic routes
router.use("/subTopic", subTopicRoute);

//question routes
router.use("/question", questionRoute);

//decision tree routes
router.use("/decisionTree", decisionTreeRoute);

//function routes
router.use("/function", functionRoute);

//variable routes
router.use("/variable", variableRoute);

//user routes
router.use("/user", userRoute);

//excel data routes
router.use("/excel-data", exceldataRoute);

//excel data routes
router.use("/excelData", excelDataRoute);

//dashboard routes
router.use("/dashboard", dashboardRoute);

// profile routes
router.use("/profile", profileRoute);

//process routes
router.use("/process", processRoute);
// profile routes
router.use("/reportTemplate", reportTemplateRoute);

router.use("/sampleFile", sampleFileRoute);

// help module routes
router.use("/help", helpModuleRoute);
module.exports = router;