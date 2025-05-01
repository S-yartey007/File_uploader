const express = require("express");
const indexRouter = express.Router();
const homeController = require("../controllers/homeController");

indexRouter.get("/", homeController.home);

module.exports = indexRouter;
