import { Router } from "express";
import userRoute from "./users/user.routes";
import adminRoute from "./admins/admin.routes";


const router = Router();

router.use("/user", userRoute);
router.use("/admin", adminRoute)

module.exports = router;
