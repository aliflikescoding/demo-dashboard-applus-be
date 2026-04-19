const prisma = require("../../lib/prisma");
const { SESSION_COOKIE_NAME } = require("../controllers/auth.controller");

async function verifySession(req, res, next) {
  try {
    const sessionToken = req.cookies?.[SESSION_COOKIE_NAME];

    if (!sessionToken) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    if (!session) {
      return res.status(401).json({ message: "Invalid session." });
    }

    if (session.expiresAt <= new Date()) {
      await prisma.session.delete({
        where: { sessionToken },
      });

      return res.status(401).json({ message: "Session expired." });
    }

    req.session = {
      id: session.id.toString(),
      expiresAt: session.expiresAt,
      token: session.sessionToken,
    };
    req.user = session.user;

    return next();
  } catch (error) {
    return next(error);
  }
}

function verifyAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Admin access required." });
  }

  return next();
}

module.exports = {
  verifyAdmin,
  verifySession,
};
