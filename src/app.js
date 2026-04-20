const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const authRouter = require("./routes/auth.route");
const personRouter = require("./routes/person.route");
const userRouter = require("./routes/user.route");
const workContractRouter = require("./routes/workContract.route");
const {
  SESSION_CLEANUP_INTERVAL_MINUTES,
  SESSION_CLEANUP_INTERVAL_MS,
  deleteExpiredSessions,
} = require("./lib/session");

const app = express();
const port = Number(process.env.PORT || 8000);

function normalizeOrigin(origin) {
  return origin?.trim().replace(/\/$/, "");
}

function expandOriginVariants(origin) {
  if (!origin) {
    return [];
  }

  try {
    const url = new URL(origin);
    const variants = new Set([normalizeOrigin(url.origin)]);

    if (url.hostname.startsWith("www.")) {
      variants.add(
        normalizeOrigin(`${url.protocol}//${url.hostname.slice(4)}${url.port ? `:${url.port}` : ""}`),
      );
    } else {
      variants.add(
        normalizeOrigin(`${url.protocol}//www.${url.hostname}${url.port ? `:${url.port}` : ""}`),
      );
    }

    return [...variants];
  } catch {
    return [normalizeOrigin(origin)];
  }
}

function getAllowedOrigins() {
  return [
    ...new Set(
      (process.env.FE_URL || "")
        .split(",")
        .flatMap((origin) => expandOriginVariants(origin.trim()))
        .filter(Boolean),
    ),
  ];
}

const allowedOrigins = getAllowedOrigins();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(normalizeOrigin(origin))) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

const apiRouter = express.Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/persons", personRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/work-contracts", workContractRouter);

apiRouter.get("/health", (_req, res) => {
  res.status(200).json({ message: "OK" });
});

app.use("/api", apiRouter);

app.use((err, _req, res, _next) => {
  console.error(err);

  res.status(500).json({
    message: err?.message || "Internal server error.",
  });
});

async function runExpiredSessionCleanup() {
  try {
    const deletedCount = await deleteExpiredSessions();

    if (deletedCount > 0) {
      console.log(`Deleted ${deletedCount} expired session(s).`);
    }
  } catch (error) {
    console.error("Failed to clean up expired sessions.", error);
  }
}

void runExpiredSessionCleanup();
setInterval(runExpiredSessionCleanup, SESSION_CLEANUP_INTERVAL_MS);

app.listen(port, () => {
  console.log(`Listening to port ${port}`);
  console.log(`Allowed CORS origins: ${allowedOrigins.join(", ") || "(none configured)"}`);
  console.log(
    `Expired session cleanup runs every ${SESSION_CLEANUP_INTERVAL_MINUTES} minute(s).`,
  );
});
