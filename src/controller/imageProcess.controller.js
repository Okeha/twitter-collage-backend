const express = require("express");
const { createCollage } = require("../service/imageProcess.service");
const multer = require("multer");

const imageProcessingRouter = express.Router();

// Configure Multer for file uploads
const upload = multer({ dest: "uploads/" }); // Specify upload directory

imageProcessingRouter.post("/collage", upload.array("images"), createCollage);

module.exports = { imageProcessingRouter };
