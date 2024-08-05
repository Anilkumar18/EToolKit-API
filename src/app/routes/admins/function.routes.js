import { Router } from "express";
const router = Router();
import jwtMiddleware from "../../../middleware/jwtValidation";
import functionController from "../../controller/admins/function.controller";

router.post("/", jwtMiddleware.jwtValidation, functionController.create);
router.get("/", jwtMiddleware.jwtValidation, functionController.getFunction)

module.exports = router;