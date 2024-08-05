import { Router } from "express";
const router = Router();
import jwtMiddleware from "../../../middleware/jwtValidation";
import reportTemplateController from "../../controller/users/reportTemplate.controller";

router.get("/", jwtMiddleware.jwtValidation, reportTemplateController.getTemplatesList);

module.exports = router;