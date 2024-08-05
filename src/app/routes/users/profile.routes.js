import { Router } from "express";
const router = Router();
import jwtMiddleware from "../../../middleware/jwtValidation";
import profileController from "../../controller/users/profile.controller";

router.get("/details", jwtMiddleware.jwtValidation, profileController.getProfileDetails);
router.get("/organization-details", jwtMiddleware.jwtValidation, profileController.getProfileOrganizationDetail);
router.put("/change-password", jwtMiddleware.jwtValidation, profileController.changePassword);

module.exports = router;