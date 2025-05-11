const { Router } = require("express");
const folderRouter = Router();
const folderController = require("../controllers/folderController");

folderRouter.get("/", folderController.getFolders);
folderRouter.get("/create", folderController.getCreateFolder);
folderRouter.post("/create", folderController.postFolder);
folderRouter.get("/:id/share", folderController.getShare);
folderRouter.delete("/:id", folderController.deleteFolder);
folderRouter.put("/:id/edit", folderController.updateName);
folderRouter.get("/:id", folderController.getFolder);
folderRouter.post("/:id/share", folderController.shareFolder);

module.exports = folderRouter;
