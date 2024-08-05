import { Router } from "express";
const router = Router();
import jwtMiddleware from "../../../middleware/jwtValidation";
import profileController from "../../controller/admins/profile.controller";

router.put("/change-password", jwtMiddleware.jwtValidation, profileController.changePassword);

module.exports = router;