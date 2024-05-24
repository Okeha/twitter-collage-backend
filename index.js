const express = require("express");
const morgan = require("morgan");
const multer = require("multer");
const cors = require("cors");
const {
  imageProcessingRouter,
} = require("./src/controller/imageProcess.controller");

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/v1/imageProcess", imageProcessingRouter);

const upload = multer({ dest: "uploads/" });

const port = process.env.PORT || 3005;

app.listen(port, () => {
  console.log(`App running on port: ${port}`);
});
