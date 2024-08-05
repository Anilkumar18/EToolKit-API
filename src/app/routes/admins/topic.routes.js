import { Router } from "express";
const router = Router();
import { joiBodyMiddleware } from "../../../middleware/joi";
import jwtMiddleware from "../../../middleware/jwtValidation";
import topicController from "../../controller/admins/topic.controller";
import * as topicValidator from "../../validation/topicValidator";


router.post("/", jwtMiddleware.jwtValidation, joiBodyMiddleware(topicValidator.createTopic), topicController.createTopic);
router.put("/:id", jwtMiddleware.jwtValidation, joiBodyMiddleware(topicValidator.updateTopic), topicController.updateTopic);
router.get("/", jwtMiddleware.jwtValidation, topicController.topicList);
router.get("/details", jwtMiddleware.jwtValidation, topicController.topicDetails);
router.delete("/:id", jwtMiddleware.jwtValidation, topicController.deleteTopic);


module.exports = router;