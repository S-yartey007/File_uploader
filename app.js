require("dotenv").config();
//const mutlerConfig = require("./mutlerConfig");
const cloudinary = require("./cloudinaryConfig");
const multer = require("multer");
const streamifier = require("streamifier");
const express = require("express");
const session = require("express-session");
const passport = require("./passportConfig");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const path = require("path");
const methodOverride = require("method-override");
const prisma = new PrismaClient();
exports.prisma = prisma;
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(methodOverride("_method"));

// ========== View Engine Setup ==========
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

//auth setup

// Session
app.use(
  session({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // ms
    },
    secret: "a santa at nasa",
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(new PrismaClient(), {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);
app.use(passport.initialize());
app.use(passport.session());

//middleware for the current user
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

//Routers
const homeRouter = require("./routers/homeRouter");
const userRouter = require("./routers/userRouter");
const fileRouter = require("./routers/fileRouter");
const folderRouter = require("./routers/folderRouter");

app.use("/", homeRouter);
app.use("/users", userRouter);
app.use("/files", fileRouter);
app.use("/folders", folderRouter);

app.post("/register", async (req, res) => {
  const { email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: { email, password: hashed },
    });
    res.status(201).json(user);
  } catch (e) {
    res.status(400).json({ error: "User already exists or invalid input" });
  }
});

app.post(
  "/users/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/users/login-error",
  })
);

app.get("/users/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ message: "Unauthorized" });
}

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post(
  "/folders/:id/upload",
  isAuthenticated,
  upload.single("file"), // allow only one file
  async (req, res) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }

    try {
      const folder = await prisma.folder.findUnique({
        where: { id: req.params.id },
      });

      if (!folder) {
        return res.status(404).json({ error: "Folder not found." });
      }
      const folderName = folder.name.trim();

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `uploads/${folderName}`,
          },
          (error, result) => {
            if (error) {
              return reject(error);
            }
            resolve(result);
          }
        );

        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

      // Save file info in DB
      await prisma.file.create({
        data: {
          name: req.file.originalname,
          size: req.file.size,
          user: { connect: { id: req.user.id } },
          folder: { connect: { id: folder.id } },
          url: result.secure_url,
        },
      });
      res.redirect(`/folders/${req.params.id}`);
    } catch (err) {
      console.error(err);
      res.render("uploadError", { folderId: req.params.id, err });
    }
  }
);

app.get("/share/:uuid", async (req, res) => {
  const { uuid } = req.params;

  try {
    const sharedLink = await prisma.sharedLink.findUnique({
      where: { id: uuid },
      include: {
        folder: {
          include: { files: true },
        },
      },
    });

    if (!sharedLink) return res.status(404).send("Invalid or expired link");

    if (new Date() > sharedLink.expiresAt) {
      return res.status(403).send("This link has expired");
    }

    res.render("sharedFolder", {
      folder: sharedLink.folder,
    });
  } catch (err) {
    console.error("Error loading shared folder:", err);
    res.status(500).send("Error accessing shared folder.");
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
