const express = require("express");

const {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
} = require("../controllers/user.controller");
const { verifyAdmin, verifySession } = require("../middleware/verify.admin");

const router = express.Router();

router.use(verifySession, verifyAdmin);

router.post("/", createUser);
router.get("/", getUsers);
router.get("/:id", getUserById);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
