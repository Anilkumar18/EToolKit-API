import { Router } from "express";
const router = Router();
import jwtMiddleware from "../../../middleware/jwtValidation";
import excelDataController from "../../controller/admins/excel-data.controller";

router.post("/addMultiSelector", excelDataController.addMultiSelectorProperties);
router.get("/multi-selector", jwtMiddleware.jwtValidation, excelDataController.getMultiSelectors);

module.exports = router;