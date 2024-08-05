import { Router } from "express";
const router = Router();
import jwtMiddleware from "../../../middleware/jwtValidation";
import { upload } from "../../../utils/fileUpload";
import sampleFileController from "../../controller/admins/sampleFile.controller";

// router.get("/", jwtMiddleware.jwtValidation, reportTemplateController.getTemplatesList);
// router.put("/", jwtMiddleware.jwtValidation, reportTemplateController.updateTemplate);
// router.get("/loopTypes", jwtMiddleware.jwtValidation, reportTemplateController.getLoopTypesList);
router.post("/", upload.single("sampleExcelFile"), sampleFileController.uploadFile);
router.get("/", sampleFileController.getUrl);

module.exports = router;