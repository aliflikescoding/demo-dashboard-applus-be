const express = require("express");

const {
  createWorkContract,
  deleteWorkContract,
  getWorkContractById,
  getWorkContracts,
  updateWorkContract,
} = require("../controllers/workContract.controller");
const {
  verifyAdmin,
  verifySession,
  verifyUser,
} = require("../middleware/verify");

const router = express.Router();

router.use(verifySession, verifyUser);

router.post("/", createWorkContract);
router.get("/", getWorkContracts);
router.get("/:id", getWorkContractById);
router.patch("/:id", updateWorkContract);
router.delete("/:id", verifyAdmin, deleteWorkContract);

module.exports = router;
