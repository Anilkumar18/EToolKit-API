import { Router } from "express";
const router = Router();
import jwtMiddleware from "../../../middleware/jwtValidation";
import transactionHistoryController from "../../controller/users/transactionHistory.controller";


router.get("/", jwtMiddleware.jwtValidation, transactionHistoryController.getQuestionList);

router.get("/details/:transactionId", jwtMiddleware.jwtValidation, transactionHistoryController.historyDetails);

router.get("/variable/:transactionId", jwtMiddleware.jwtValidation, transactionHistoryController.getVariable);

router.get("/list", jwtMiddleware.jwtValidation, transactionHistoryController.historyList);

router.get("/:transactionId", jwtMiddleware.jwtValidation, transactionHistoryController.transactionDetails);

module.exports = router;