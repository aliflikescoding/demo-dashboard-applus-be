const express = require("express");

const {
  getAdminStatus,
  getCurrentUser,
  login,
  logout,
  register,
} = require("../controllers/auth.controller");
const { verifyAdmin, verifySession } = require("../middleware/verify.admin");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", verifySession, getCurrentUser);
router.get("/admin", verifySession, verifyAdmin, getAdminStatus);

module.exports = router;
