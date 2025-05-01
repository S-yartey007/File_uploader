const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config({ path: "../.env" });

const prisma = new PrismaClient();
exports.signUpPost = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Basic validation
    if (!email || !password) {
      return res.redirect("/users/signup");
    }

    // Check if user already exists
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (user) {
      res.send("<h2>User already exists</h2>");
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into DB

    await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
      },
    });
    res.redirect("/users/login");
  } catch (err) {
    console.error("Error signing up:", err);
    res.redirect("/users/signup");
  }
};

exports.signUpGet = async (req, res) => {
  res.render("signup");
};

exports.loginGet = async (req, res) => {
  res.render("login");
};

exports.memberJoin = async (req, res) => {
  res.render("join");
};

exports.addMembers = async (req, res) => {
  const { code } = req.body;
  if (code === process.env.MEMBERSHIP_CODE) {
    await queries.addMembers(req.user.id);
    res.redirect("/");
  } else {
    res.send("<h1>Enter correct code</h1>");
  }
};

exports.loginError = async (req, res) => {
  res.render("error", { title: "Login Error: User does not exist" });
};
