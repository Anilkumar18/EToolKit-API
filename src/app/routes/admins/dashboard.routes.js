import { Router } from "express";
const router = Router();
import jwtMiddleware from "../../../middleware/jwtValidation";
import dashboardController from "../../controller/admins/dashboard.controller";

router.get("/", jwtMiddleware.jwtValidation, dashboardController.getDashboard);
router.post("/dump-db", jwtMiddleware.jwtValidation, dashboardController.dumpDatabase);
router.post("/restore-db", jwtMiddleware.jwtValidation, dashboardController.restoreDatabase);

module.exports = router;