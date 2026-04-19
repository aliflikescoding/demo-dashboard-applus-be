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

function normalizeInt(value, fieldName) {
  if (value === undefined) {
    return { value: undefined };
  }

  if (value === null || value === "") {
    return { value: null };
  }

  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    return { error: `Invalid ${fieldName}.` };
  }

  return { value: parsed };
}

function normalizeDate(value, fieldName) {
  if (value === undefined) {
    return { value: undefined };
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return { error: `Invalid ${fieldName}.` };
  }

  return { value: parsed };
}

function normalizeWorkContract(workContract) {
  return {
    workContractNumber: workContract.workContractNumber,
    personId: workContract.personId,
    startDate: workContract.startDate,
    jobTitle: workContract.jobTitle,
    jobType: workContract.jobType,
    jobYear: workContract.jobYear,
    contractType: workContract.contractType,
    salaryMonth: workContract.salaryMonth,
    salaryHour: workContract.salaryHour,
    leave: workContract.leave,
    sickLeave: workContract.sickLeave,
    createdAt: workContract.createdAt,
    updatedAt: workContract.updatedAt,
    person: workContract.person
      ? {
          id: workContract.person.id,
          nik: workContract.person.nik,
          passportNumber: workContract.person.passportNumber,
          name: workContract.person.name,
          npwp: workContract.person.npwp,
          address: workContract.person.address,
          dateOfBirth: workContract.person.dateOfBirth,
          createdAt: workContract.person.createdAt,
          updatedAt: workContract.person.updatedAt,
        }
      : undefined,
  };
}

function buildWorkContractData(payload) {
  const data = {};

  if (payload.personId !== undefined) {
    data.personId = payload.personId;
  }

  if (payload.startDate !== undefined) {
    const { value, error } = normalizeDate(payload.startDate, "startDate");

    if (error) {
      return { error };
    }

    data.startDate = value;
  }

  if (payload.jobTitle !== undefined) {
    data.jobTitle = payload.jobTitle;
  }

  if (payload.jobType !== undefined) {
    data.jobType = payload.jobType;
  }

  if (payload.jobYear !== undefined) {
    const { value, error } = normalizeInt(payload.jobYear, "jobYear");

    if (error) {
      return { error };
    }

    data.jobYear = value;
  }

  if (payload.contractType !== undefined) {
    data.contractType = payload.contractType;
  }

  if (payload.salaryMonth !== undefined) {
    const { value, error } = normalizeInt(payload.salaryMonth, "salaryMonth");

    if (error) {
      return { error };
    }

    data.salaryMonth = value;
  }

  if (payload.salaryHour !== undefined) {
    const { value, error } = normalizeInt(payload.salaryHour, "salaryHour");

    if (error) {
      return { error };
    }

    data.salaryHour = value;
  }

  if (payload.leave !== undefined) {
    const { value, error } = normalizeInt(payload.leave, "leave");

    if (error) {
      return { error };
    }

    data.leave = value;
  }

  if (payload.sickLeave !== undefined) {
    const { value, error } = normalizeInt(payload.sickLeave, "sickLeave");

    if (error) {
      return { error };
    }

    data.sickLeave = value;
  }

  return { data };
}

async function createWorkContract(req, res, next) {
  try {
    const {
      workContractNumber,
      personId,
      startDate,
      jobTitle,
      jobType,
      jobYear,
      contractType,
      salaryMonth,
      salaryHour,
      leave,
      sickLeave,
    } = req.body;

    if (!workContractNumber || !personId || !startDate || !jobTitle) {
      return res.status(400).json({
        message: "workContractNumber, personId, startDate, and jobTitle are required.",
      });
    }

    if (leave === undefined || sickLeave === undefined) {
      return res.status(400).json({
        message: "leave and sickLeave are required.",
      });
    }

    const { data, error } = buildWorkContractData({
      personId,
      startDate,
      jobTitle,
      jobType,
      jobYear,
      contractType,
      salaryMonth,
      salaryHour,
      leave,
      sickLeave,
    });

    if (error) {
      return res.status(400).json({ message: error });
    }

    const workContract = await prisma.workContract.create({
      data: {
        workContractNumber,
        ...data,
      },
      include: {
        person: true,
      },
    });

    return res.status(201).json({
      message: "Work contract created successfully.",
      workContract: normalizeWorkContract(workContract),
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "Work contract number already exists." });
    }

    if (error.code === "P2003") {
      return res.status(400).json({ message: "Invalid personId." });
    }

    return next(error);
  }
}

async function getWorkContracts(req, res, next) {
  try {
    const page = parsePositiveInt(req.query.page, DEFAULT_PAGE);
    const limit = Math.min(parsePositiveInt(req.query.limit, DEFAULT_LIMIT), MAX_LIMIT);
    const skip = (page - 1) * limit;

    const [totalItems, workContracts] = await Promise.all([
      prisma.workContract.count(),
      prisma.workContract.findMany({
        include: {
          person: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

    return res.status(200).json({
      data: workContracts.map(normalizeWorkContract),
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

async function getWorkContractById(req, res, next) {
  try {
    const workContract = await prisma.workContract.findUnique({
      where: { workContractNumber: req.params.id },
      include: {
        person: true,
      },
    });

    if (!workContract) {
      return res.status(404).json({ message: "Work contract not found." });
    }

    return res.status(200).json({
      workContract: normalizeWorkContract(workContract),
    });
  } catch (error) {
    return next(error);
  }
}

async function updateWorkContract(req, res, next) {
  try {
    const existingWorkContract = await prisma.workContract.findUnique({
      where: { workContractNumber: req.params.id },
    });

    if (!existingWorkContract) {
      return res.status(404).json({ message: "Work contract not found." });
    }

    const { data, error } = buildWorkContractData(req.body);

    if (error) {
      return res.status(400).json({ message: error });
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        message: "At least one updatable field is required.",
      });
    }

    const workContract = await prisma.workContract.update({
      where: { workContractNumber: req.params.id },
      data,
      include: {
        person: true,
      },
    });

    return res.status(200).json({
      message: "Work contract updated successfully.",
      workContract: normalizeWorkContract(workContract),
    });
  } catch (error) {
    if (error.code === "P2003") {
      return res.status(400).json({ message: "Invalid personId." });
    }

    return next(error);
  }
}

async function deleteWorkContract(req, res, next) {
  try {
    const existingWorkContract = await prisma.workContract.findUnique({
      where: { workContractNumber: req.params.id },
    });

    if (!existingWorkContract) {
      return res.status(404).json({ message: "Work contract not found." });
    }

    await prisma.workContract.delete({
      where: { workContractNumber: req.params.id },
    });

    return res.status(200).json({ message: "Work contract deleted successfully." });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createWorkContract,
  deleteWorkContract,
  getWorkContractById,
  getWorkContracts,
  updateWorkContract,
};
