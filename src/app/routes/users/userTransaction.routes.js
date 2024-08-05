import { Router } from "express";
import { joiBodyMiddleware } from "../../../middleware/joi";
const router = Router();
import jwtMiddleware from "../../../middleware/jwtValidation";
import userTransactionNewController from "../../controller/users/userTransaction.controller";
import * as userTransactionValidator from "../../validation/userTransactionValidator"


router.get("/", jwtMiddleware.jwtValidation, userTransactionNewController.traversalData);

router.post("/", jwtMiddleware.jwtValidation, joiBodyMiddleware(userTransactionValidator.createRootNodeForTransaction), userTransactionNewController.startTransaction);

router.post("/add", jwtMiddleware.jwtValidation, joiBodyMiddleware(userTransactionValidator.traverseNodeForTransaction), userTransactionNewController.addTransaction);

router.get("/report", jwtMiddleware.jwtValidation, userTransactionNewController.getReportUrl);

router.get("/summary", jwtMiddleware.jwtValidation, userTransactionNewController.getReportHtml);

router.post("/complete", jwtMiddleware.jwtValidation, userTransactionNewController.completeTransaction);

router.put("/:transactionId", jwtMiddleware.jwtValidation, userTransactionNewController.reTraverse)

router.post("/getDecisionNode", jwtMiddleware.jwtValidation, userTransactionNewController.decisionNodeData);

module.exports = router;