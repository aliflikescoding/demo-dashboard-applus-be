const express = require("express");

const {
  createWorkContract,
  deleteWorkContract,
  getWorkContractById,
  getWorkContracts,
  updateWorkContract,
} = require("../controllers/workContract.controller");
const { verifyAdmin, verifySession } = require("../middleware/verify.admin");

const router = express.Router();

router.use(verifySession);

router.post("/", createWorkContract);
router.get("/", getWorkContracts);
router.get("/:id", getWorkContractById);
router.patch("/:id", updateWorkContract);
router.delete("/:id", verifyAdmin, deleteWorkContract);

module.exports = router;
