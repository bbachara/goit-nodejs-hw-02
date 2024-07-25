const express = require("express");
const userCtrl = require("../../controller/user");
const auth = require("../../middleware/auth");

const router = express.Router();

router.post("/register", userCtrl.register);
router.post("/login", userCtrl.login);
router.post("/logout", auth, userCtrl.logout);
router.get("/current", auth, userCtrl.getCurrent);
router.patch(
  "/avatars",
  auth,
  userCtrl.upload.single("avatar"),
  userCtrl.updateAvatar
);
router.get("/verify/:verificationToken", userCtrl.verifyUser);
router.post("/verify", userCtrl.resendVerificationEmail);
router.delete("/delete", auth, userCtrl.deleteUser);

module.exports = router;
