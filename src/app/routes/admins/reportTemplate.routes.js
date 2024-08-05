import { Router } from "express";
const router = Router();
import jwtMiddleware from "../../../middleware/jwtValidation";
import reportTemplateController from "../../controller/admins/reportTemplate.controller";

router.get("/", jwtMiddleware.jwtValidation, reportTemplateController.getTemplatesList);
router.put("/", jwtMiddleware.jwtValidation, reportTemplateController.updateTemplate);
router.get("/loopTypes", jwtMiddleware.jwtValidation, reportTemplateController.getLoopTypesList);


module.exports = router;