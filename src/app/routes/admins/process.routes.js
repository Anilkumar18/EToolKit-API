import { Router } from "express";
const router = Router();
import jwtMiddleware from "../../../middleware/jwtValidation";
import processController from "../../controller/admins/process.controller"

router.post("/", jwtMiddleware.jwtValidation, processController.create);
router.put("/", jwtMiddleware.jwtValidation, processController.update);
router.post("/create", jwtMiddleware.jwtValidation, processController.addPreDefinedLogic);
router.get("/list", jwtMiddleware.jwtValidation, processController.getPreDefinedLogic);
router.get("/details/:preDefineLogicId", jwtMiddleware.jwtValidation, processController.getTreeForPredefinedLogic);
router.get("/variables/:processId", jwtMiddleware.jwtValidation, processController.variableList)
router.get("/loop_variables/:loopId", jwtMiddleware.jwtValidation, processController.staticLoopVariableList);
router.get("/tree/list", jwtMiddleware.jwtValidation, processController.getProcessListHavingDecisionTree);
router.put("/update", jwtMiddleware.jwtValidation, processController.updateProcess);
router.delete("/delete/:processId", jwtMiddleware.jwtValidation, processController.deleteProcess);

module.exports = router;