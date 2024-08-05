import { Router } from "express";
const router = Router();
import jwtMiddleware from "../../../middleware/jwtValidation";
import { joiBodyMiddleware } from "../../../middleware/joi";
import questionController from "../../controller/admins/question.controller";
import * as questionValidator from "../../validation/questionValidator";
import { upload } from "../../../utils/fileUpload";


router.post("/", jwtMiddleware.jwtValidation,upload.single("helpFile"), joiBodyMiddleware(questionValidator.createQuestion), questionController.create);
router.put("/:id", jwtMiddleware.jwtValidation,upload.single("helpFile"), joiBodyMiddleware(questionValidator.updateQuestion), questionController.update);
router.delete("/:id", jwtMiddleware.jwtValidation, questionController.delete);
router.post("/clone",jwtMiddleware.jwtValidation, questionController.clone);


module.exports = router;