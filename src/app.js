const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const authRouter = require("./routes/auth.route");

const app = express();
const port = Number(process.env.PORT || 8000);

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

const apiRouter = express.Router();

apiRouter.use("/auth", authRouter);

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

app.listen(port, () => {
  console.log(`Listening to port ${port}`);
});
