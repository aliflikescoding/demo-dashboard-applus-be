const bcrypt = require("bcrypt");
const crypto = require("crypto");

const prisma = require("../../lib/prisma");
const {
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
} = require("../lib/session");

function sanitizeUser(user) {
  return {
    id: user.id.toString(),
    username: user.username,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function createSession(userId) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const sessionToken = crypto.randomBytes(48).toString("hex");

  const session = await prisma.session.create({
    data: {
      userId,
      sessionToken,
      expiresAt,
    },
  });

  return { sessionToken: session.sessionToken, expiresAt: session.expiresAt };
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const { sessionToken, expiresAt } = await createSession(user.id);

    res.cookie(SESSION_COOKIE_NAME, sessionToken, getSessionCookieOptions(expiresAt));

    return res.status(200).json({
      message: "Login successful.",
      user: sanitizeUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res, next) {
  try {
    const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];

    if (sessionToken) {
      await prisma.session.deleteMany({
        where: { sessionToken },
      });
    }

    res.clearCookie(SESSION_COOKIE_NAME, getSessionCookieOptions());

    return res.status(200).json({ message: "Logout successful." });
  } catch (error) {
    return next(error);
  }
}

async function getCurrentUser(req, res) {
  return res.status(200).json({ user: sanitizeUser(req.user) });
}

async function getAdminStatus(req, res) {
  return res.status(200).json({
    message: "Admin access verified.",
    user: sanitizeUser(req.user),
  });
}

module.exports = {
  SESSION_COOKIE_NAME,
  getAdminStatus,
  getCurrentUser,
  login,
  logout,
  sanitizeUser,
};
