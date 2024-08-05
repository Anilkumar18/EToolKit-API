import { Router } from "express";
const router = Router();
import { joiBodyMiddleware } from "../../../middleware/joi";
import * as organizationValidator from "../../validation/organizationValidator";
import jwtMiddleware from "../../../middleware/jwtValidation";
import adminOrganizationController from '../../controller/admins/organization.controller';


//organization routes
router.post("/", jwtMiddleware.jwtValidation, joiBodyMiddleware(organizationValidator.createOrganization), adminOrganizationController.createOrganization);
router.put("/:id", jwtMiddleware.jwtValidation, joiBodyMiddleware(organizationValidator.updateOrganization), adminOrganizationController.updateOrganization);
router.get("/", jwtMiddleware.jwtValidation, adminOrganizationController.organizationList);
router.get("/edit/:id", jwtMiddleware.jwtValidation, adminOrganizationController.organizationDetail);

module.exports = router;