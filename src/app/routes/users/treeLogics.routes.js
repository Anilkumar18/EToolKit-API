import { Router } from "express";
const router = Router();
import jwtMiddleware from "../../../middleware/jwtValidation";
import treeLogicsNewController from "../../controller/users/treeLogicsNew.controller";

router.post("/execute-loop-process", jwtMiddleware.jwtValidation, treeLogicsNewController.executeLoopProcessTest);
router.post("/genrep", treeLogicsNewController.getDemoMainJson);
router.post("/pdfRep", treeLogicsNewController.generateHTMLToPDF);

module.exports = router;