const fs = require("fs");
const multer = require("multer");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const fileStorage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const folderStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // Create folder path dynamically based on the folder structure from client
    const folder = await prisma.folder.findUnique({
      where: {
        id: req.params.id,
      },
    });
    const folderPath = path.join(__dirname, "uploads", folder.name);
    console.log("folderpath", folderPath);

    fs.mkdirSync(folderPath, { recursive: true });
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    cb(null, path.basename(file.originalname)); // Keep original filename
  },
});

const fileUpload = multer({ fileStorage });
const folderUpload = multer({ storage: folderStorage });

module.exports = {
  fileUpload,
  folderUpload,
};
