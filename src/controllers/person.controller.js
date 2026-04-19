const crypto = require("crypto");

const prisma = require("../../lib/prisma");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

function normalizePerson(person) {
  return {
    id: person.id,
    nik: person.nik,
    passportNumber: person.passportNumber,
    name: person.name,
    npwp: person.npwp,
    address: person.address,
    dateOfBirth: person.dateOfBirth,
    createdAt: person.createdAt,
    updatedAt: person.updatedAt,
  };
}

function buildPersonData(payload) {
  const data = {};

  if (payload.nik !== undefined) {
    data.nik = payload.nik || null;
  }

  if (payload.passportNumber !== undefined) {
    data.passportNumber = payload.passportNumber || null;
  }

  if (payload.name !== undefined) {
    data.name = payload.name;
  }

  if (payload.npwp !== undefined) {
    data.npwp = payload.npwp;
  }

  if (payload.address !== undefined) {
    data.address = payload.address;
  }

  if (payload.dateOfBirth !== undefined) {
    const dateOfBirth = new Date(payload.dateOfBirth);

    if (Number.isNaN(dateOfBirth.getTime())) {
      return { error: "Invalid dateOfBirth." };
    }

    data.dateOfBirth = dateOfBirth;
  }

  return { data };
}

async function createPerson(req, res, next) {
  try {
    const { nik, passportNumber, name, npwp, address, dateOfBirth } = req.body;

    if (!name || !npwp || !address || !dateOfBirth) {
      return res.status(400).json({
        message: "name, npwp, address, and dateOfBirth are required.",
      });
    }

    const { data, error } = buildPersonData({
      nik,
      passportNumber,
      name,
      npwp,
      address,
      dateOfBirth,
    });

    if (error) {
      return res.status(400).json({ message: error });
    }

    const person = await prisma.person.create({
      data: {
        id: crypto.randomUUID(),
        ...data,
      },
    });

    return res.status(201).json({
      message: "Person created successfully.",
      person: normalizePerson(person),
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "nik or passportNumber already exists." });
    }

    return next(error);
  }
}

async function getPersons(req, res, next) {
  try {
    const page = parsePositiveInt(req.query.page, DEFAULT_PAGE);
    const limit = Math.min(parsePositiveInt(req.query.limit, DEFAULT_LIMIT), MAX_LIMIT);
    const skip = (page - 1) * limit;

    const [totalItems, persons] = await Promise.all([
      prisma.person.count(),
      prisma.person.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

    return res.status(200).json({
      data: persons.map(normalizePerson),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getPersonById(req, res, next) {
  try {
    const person = await prisma.person.findUnique({
      where: { id: req.params.id },
    });

    if (!person) {
      return res.status(404).json({ message: "Person not found." });
    }

    return res.status(200).json({ person: normalizePerson(person) });
  } catch (error) {
    return next(error);
  }
}

async function updatePerson(req, res, next) {
  try {
    const { data, error } = buildPersonData(req.body);

    if (error) {
      return res.status(400).json({ message: error });
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: "At least one updatable field is required.",
      });
    }

    const existingPerson = await prisma.person.findUnique({
      where: { id: req.params.id },
    });

    if (!existingPerson) {
      return res.status(404).json({ message: "Person not found." });
    }

    const person = await prisma.person.update({
      where: { id: req.params.id },
      data,
    });

    return res.status(200).json({
      message: "Person updated successfully.",
      person: normalizePerson(person),
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "nik or passportNumber already exists." });
    }

    return next(error);
  }
}

async function deletePerson(req, res, next) {
  try {
    const existingPerson = await prisma.person.findUnique({
      where: { id: req.params.id },
    });

    if (!existingPerson) {
      return res.status(404).json({ message: "Person not found." });
    }

    await prisma.person.delete({
      where: { id: req.params.id },
    });

    return res.status(200).json({ message: "Person deleted successfully." });
  } catch (error) {
    if (error.code === "P2003") {
      return res.status(409).json({
        message: "Person cannot be deleted because related records still exist.",
      });
    }

    return next(error);
  }
}

module.exports = {
  createPerson,
  deletePerson,
  getPersonById,
  getPersons,
  updatePerson,
};
