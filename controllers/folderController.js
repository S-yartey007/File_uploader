const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const cloudinary = require("../cloudinaryConfig");
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

    const folderName = `uploads/${folder.name.trim()}`; // Cloudinary folder path
    await cloudinary.api.delete_resources_by_prefix(folderName);
    console.log("Files deletion initiated...");

    await cloudinary.api.delete_folder(folderName);
    console.log("Deleted folder");
    // Delete files from DB
    await prisma.file.deleteMany({ where: { folderId } });

    // Delete folder from DB
    await prisma.folder.delete({ where: { id: folderId } });

    res.redirect("/folders");
  } catch (err) {
    console.error("Error deleting folder:", err);
    res.render("deleteError", { err });
  }
}

async function shareFolder(req, res) {
  const folderId = req.params.id;
  const { duration } = req.body; // E.g., "1d", "10d"

  const days = parseInt(duration.replace("d", ""), 10);
  if (isNaN(days)) return res.status(400).send("Invalid duration format.");

  function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  try {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) return res.status(404).send("Folder not found");

    const expiresAt = addDays(new Date(), days);

    const sharedLink = await prisma.sharedLink.create({
      data: {
        folderId: folder.id,
        expiresAt,
      },
    });

    const publicUrl = `${req.protocol}://${req.get("host")}/share/${
      sharedLink.id
    }`;

    res.render("shareSuccess", { publicUrl, expiresAt });
  } catch (err) {
    console.error("Error sharing folder:", err);
    res.status(500).send("Unable to share folder.");
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

async function getShare(req, res) {
  const id = req.params.id;
  res.render("shareForm", { id });
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
  shareFolder,
  getShare,
};
