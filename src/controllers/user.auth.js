const bcrypt = require("bcrypt");

const prisma = require("../../lib/prisma");
const { sanitizeUser } = require("./auth.controller");

const SALT_ROUNDS = 10;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function parseUserId(rawId) {
  try {
    return BigInt(rawId);
  } catch {
    return null;
  }
}

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

async function createUser(req, res, next) {
  try {
    const { username, password, isAdmin = false } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(409).json({ message: "Username already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        isAdmin: Boolean(isAdmin),
      },
    });

    return res.status(201).json({
      message: "User created successfully.",
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

async function getUsers(req, res, next) {
  try {
    const page = parsePositiveInt(req.query.page, DEFAULT_PAGE);
    const limit = Math.min(parsePositiveInt(req.query.limit, DEFAULT_LIMIT), MAX_LIMIT);
    const skip = (page - 1) * limit;

    const [totalItems, users] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

    return res.status(200).json({
      data: users.map(sanitizeUser),
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

async function getUserById(req, res, next) {
  try {
    const userId = parseUserId(req.params.id);

    if (userId === null) {
      return res.status(400).json({ message: "Invalid user id." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (error) {
    return next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const userId = parseUserId(req.params.id);

    if (userId === null) {
      return res.status(400).json({ message: "Invalid user id." });
    }

    const { username, password, isAdmin } = req.body;

    if (username === undefined && password === undefined && isAdmin === undefined) {
      return res.status(400).json({
        message: "At least one of username, password, or isAdmin is required.",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found." });
    }

    if (username && username !== existingUser.username) {
      const usernameTaken = await prisma.user.findUnique({
        where: { username },
      });

      if (usernameTaken) {
        return res.status(409).json({ message: "Username already exists." });
      }
    }

    const data = {};

    if (username !== undefined) {
      data.username = username;
    }

    if (password !== undefined) {
      data.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    if (isAdmin !== undefined) {
      data.isAdmin = Boolean(isAdmin);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
    });

    return res.status(200).json({
      message: "User updated successfully.",
      user: sanitizeUser(updatedUser),
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const userId = parseUserId(req.params.id);

    if (userId === null) {
      return res.status(400).json({ message: "Invalid user id." });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found." });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createUser,
  deleteUser,
  getUserById,
  getUsers,
  updateUser,
};
