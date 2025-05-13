const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const path = require("path");

async function getUpload(req, res) {
  res.render("uploadFiles");
}

async function downloadFile(req, res) {
  try {
    const file = await prisma.file.findUnique({
      where: { id: req.params.id },
    });

    const folder = await prisma.folder.findUnique({
      where: {
        id: file.folderId,
      },
    });

    if (!file || !file.url) {
      return res.status(404).send("File not found.");
    }

    /*  const parentDir = path.dirname(__dirname);
    const filePath = path.join(parentDir, "uploads", folder.name, file.name);
    console.log(filePath);
    res.download(filePath, file.name);  */ // Sends the file for download
    const cloudinaryUrl = file.url;
    console.log("cloudinaryUrl", cloudinaryUrl);

    const downloadUrl = cloudinaryUrl.replace(
      "/upload/",
      `/upload/fl_attachment/`
    );
    console.log("downloadUrl", downloadUrl);
    res.redirect(downloadUrl);
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).send("Failed to download file.");
  }
}

module.exports = {
  getUpload,
  downloadFile,
};
