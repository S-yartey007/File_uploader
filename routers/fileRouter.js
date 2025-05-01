const { Router } = require("express");
const fileRouter = Router();
const fileController = require("../controllers/fileController");

fileRouter.get("/upload", fileController.getUpload);
fileRouter.get("/download/:id", fileController.downloadFile);

module.exports = fileRouter;
