import { Router } from "express";
const router = Router();
import jwtMiddleware from "../../../middleware/jwtValidation";
import { upload } from "../../../utils/fileUpload";
import helpModuleController from "../../controller/admins/helpModule.controller";


router.get("/:code", jwtMiddleware.jwtValidation, helpModuleController.getPageInfo);
router.get("/", jwtMiddleware.jwtValidation, helpModuleController.getInfo);
router.put("/:id", jwtMiddleware.jwtValidation, upload.single("helpFile"), helpModuleController.updateData);

module.exports = router;