const express = require("express");

const {
  createPerson,
  deletePerson,
  getPersonById,
  getPersons,
  updatePerson,
} = require("../controllers/person.controller");
const { verifyAdmin, verifySession } = require("../middleware/verify.admin");

const router = express.Router();

router.use(verifySession);

router.post("/", createPerson);
router.get("/", getPersons);
router.get("/:id", getPersonById);
router.patch("/:id", updatePerson);
router.delete("/:id", verifyAdmin, deletePerson);

module.exports = router;
