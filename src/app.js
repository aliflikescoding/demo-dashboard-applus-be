const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const port = process.env.PORT || "5000";

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(bodyParser.json());
app.use(cookieParser());

const apiRouter = express.Router();

app.use("/api", apiRouter);

app.listen(port, () => {
  console.log(`Listening to port ${port}`);
});
