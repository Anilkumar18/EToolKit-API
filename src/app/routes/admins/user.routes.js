import { Router } from "express";
const router = Router();
import { joiBodyMiddleware } from "../../../middleware/joi";
import jwtMiddleware from "../../../middleware/jwtValidation";
import userController from "../../controller/admins/user.controller";
import * as usersValidator from "../../validation/usersValidator";


router.post("/", jwtMiddleware.jwtValidation, joiBodyMiddleware(usersValidator.createUser), userController.createUser);
router.get("/", jwtMiddleware.jwtValidation, userController.userList);
router.get("/details/:id", jwtMiddleware.jwtValidation, userController.userDetails);
router.put("/:id", jwtMiddleware.jwtValidation, joiBodyMiddleware(usersValidator.updateUser), userController.updateUser);
router.delete("/:id", jwtMiddleware.jwtValidation, userController.deleteUser);
router.put("/:id/password", jwtMiddleware.jwtValidation, joiBodyMiddleware(usersValidator.resetUserPasswordSchema), userController.updateUserPassword);


module.exports = router;