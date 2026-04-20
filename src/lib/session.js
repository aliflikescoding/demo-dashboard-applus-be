const prisma = require("../../lib/prisma");

const isProduction = process.env.NODE_ENV === "production";
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "session_token";
const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS || 7);
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
const SESSION_CLEANUP_INTERVAL_MINUTES = Number(process.env.SESSION_CLEANUP_INTERVAL_MINUTES || 60);
const SESSION_CLEANUP_INTERVAL_MS = SESSION_CLEANUP_INTERVAL_MINUTES * 60 * 1000;

function getSessionCookieOptions(expiresAt) {
  const options = {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    path: "/",
  };

  if (expiresAt) {
    options.expires = expiresAt;
  }

  return options;
}

async function deleteExpiredSessions() {
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lte: new Date(),
      },
    },
  });

  return result.count;
}

module.exports = {
  getSessionCookieOptions,
  isProduction,
  SESSION_CLEANUP_INTERVAL_MINUTES,
  SESSION_CLEANUP_INTERVAL_MS,
  SESSION_COOKIE_NAME,
  SESSION_TTL_DAYS,
  SESSION_TTL_MS,
  deleteExpiredSessions,
};
