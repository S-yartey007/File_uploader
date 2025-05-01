const express = require("express");
const userRouter = express.Router();
const userController = require("../controllers/userController");

userRouter.get("/login", userController.loginGet);
userRouter.get("/signup", userController.signUpGet);
userRouter.post("/signup", userController.signUpPost);
userRouter.get("/members/join", userController.memberJoin);
userRouter.post("/members/join", userController.addMembers);
userRouter.get("/login-error", userController.loginError);

module.exports = userRouter;
