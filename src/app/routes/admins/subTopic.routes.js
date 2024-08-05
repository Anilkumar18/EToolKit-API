import { Router } from "express";
const router = Router();
import jwtMiddleware from "../../../middleware/jwtValidation";
import { joiBodyMiddleware } from "../../../middleware/joi";
import subTopicController from "../../controller/admins/subTopic.controller";
import * as subTopicValidator from "../../validation/subTopicValidator";

router.post("/", jwtMiddleware.jwtValidation, joiBodyMiddleware(subTopicValidator.createSubTopic), subTopicController.create);
router.put("/:id", jwtMiddleware.jwtValidation, joiBodyMiddleware(subTopicValidator.updateSubTopic), subTopicController.update);
router.get("/:id", jwtMiddleware.jwtValidation, subTopicController.details);
router.delete("/:id", jwtMiddleware.jwtValidation, subTopicController.delete);

module.exports = router;


