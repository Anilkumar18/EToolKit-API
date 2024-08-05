import { Router } from "express";
const router = Router();

import profileRoute from "./profile.routes";
import userTransactionRoutes from "./userTransaction.routes";
import transactionHistoryRoutes from "./transactionHistory.routes";
import treeLogicsRoutes from "./treeLogics.routes";
import reportTemplateRoutes from "./reportTemplate.routes";

import userUserController from "../../controller/users/user.controller";
import jwtMiddleware from "../../../middleware/jwtValidation";

router.post("/login", userUserController.login);
router.post("/send-otp", userUserController.send_otp);
router.post("/reset-password", userUserController.reset_password);
router.delete("/", jwtMiddleware.jwtValidation, userUserController.deleteAccount);

router.use("/traversal", userTransactionRoutes);
router.use("/tree-logics", treeLogicsRoutes);
router.use("/history", transactionHistoryRoutes);
router.use("/profile", profileRoute);
router.use("/reportTemplate", reportTemplateRoutes);


module.exports = router;
