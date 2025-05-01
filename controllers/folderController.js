const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const path = require("path");
const fs = require("fs");
async function getCreateFolder(req, res) {
  res.render("createFolder");
}

async function postFolder(req, res) {
  try {
    // Create the folder if it doesn't exist
    const folderName = req.body.name; // e.g., "my-folder"

    const folder = await prisma.folder.create({
      data: {
        name: folderName,
        user: { connect: { id: req.user.id } },
      },
    });
    if (!folderName) return res.status(400).send("Folder name required");

    const folderPath = path.join(__dirname, "../uploads", folderName);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    res.redirect("/folders");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating folder");
  }
}

async function deleteFolder(req, res) {
  const folderId = req.params.id;

  try {
    // Get folder info including associated files
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: { files: true },
    });

    if (!folder) return res.status(404).send("Folder not found.");

    // Delete files from filesystem
    folder.files.forEach((file) => {
      const parentDir = path.dirname(__dirname);
      const filePath = path.join(parentDir, "uploads", folder.name, file.name);
      console.log(filePath);
      if (fs.existsSync(filePath)) {
        console.log("exits", filePath);
        fs.unlinkSync(filePath);
      }
    });

    // Delete files from DB
    await prisma.file.deleteMany({ where: { folderId } });

    // Delete folder from DB
    await prisma.folder.delete({ where: { id: folderId } });

    // Optionally delete the physical folder
    const parentDir = path.dirname(__dirname);
    const folderPath = path.join(parentDir, "uploads", folder.name);
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
    }

    res.redirect("/folders");
  } catch (err) {
    console.error("Error deleting folder:", err);
    res.status(500).send("Failed to delete folder.");
  }
}

async function getFolders(req, res) {
  const folders = await prisma.folder.findMany({
    where: {
      userId: req.user.id, // assuming you're using Passport and the user is authenticated
    },
    include: {
      files: true, // optional: includes all files inside each folder
    },
  });
  res.render("folders", { folders });
}

async function updateName(req, res) {
  const folderId = req.params.id;
  const newName = req.body.name;

  try {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) return res.status(404).send("Folder not found");

    // Rename physical folder in filesystem
    const oldPath = path.join(__dirname, "../uploads", folder.name);
    const newPath = path.join(__dirname, "../uploads", newName);
    console.log(oldPath);
    console.log(newPath);
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
    } else {
      console.log("hello");
    }

    // Update in DB
    await prisma.folder.update({
      where: { id: folderId },
      data: { name: newName },
    });

    res.redirect("/folders");
  } catch (err) {
    console.error("Error updating folder:", err);
    res.status(500).send("Failed to update folder.");
  }
}
async function getFolder(req, res) {
  const folder = await prisma.folder.findUnique({
    where: {
      id: req.params.id,
    },
    include: {
      files: true,
    },
  });
  res.render("folder", { folder });
}
module.exports = {
  getCreateFolder,
  getFolders,
  getFolder,
  postFolder,
  deleteFolder,
  updateName,
};
