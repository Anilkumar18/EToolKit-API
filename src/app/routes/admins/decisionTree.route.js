import { Router } from "express";
const router = Router();
import jwtMiddleware from "../../../middleware/jwtValidation";
import { joiBodyMiddleware } from "../../../middleware/joi";
import * as decisionTreeValidator from "../../validation/decisionTreeValidator";
import decisionTreeController from '../../controller/admins/decisionTree.controller';


router.post("/", jwtMiddleware.jwtValidation, joiBodyMiddleware(decisionTreeValidator.createDecisionTree), decisionTreeController.create)
router.get("/:questionId", jwtMiddleware.jwtValidation, decisionTreeController.details);
router.put("/", jwtMiddleware.jwtValidation, joiBodyMiddleware(decisionTreeValidator.updateDecisionTree), decisionTreeController.updateDecisionTree);
router.delete("/:questionId", jwtMiddleware.jwtValidation, decisionTreeController.deleteDecisionTree);
// router.get("/process/:preDefineLogicId", jwtMiddleware.jwtValidation, decisionTreeController.getTreeForPredefinedLogic)

module.exports = router;