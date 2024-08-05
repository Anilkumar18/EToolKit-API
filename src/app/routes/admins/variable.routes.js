import { Router } from "express";
const router = Router();
import jwtMiddleware from "../../../middleware/jwtValidation";
import variableController from "../../controller/admins/variable.controller";

router.post("/", jwtMiddleware.jwtValidation, variableController.create);
router.get("/", jwtMiddleware.jwtValidation, variableController.getVariable);
router.get("/list/:logic", jwtMiddleware.jwtValidation, variableController.variableList);
router.get("/operators", jwtMiddleware.jwtValidation, variableController.operatorList);



module.exports = router;