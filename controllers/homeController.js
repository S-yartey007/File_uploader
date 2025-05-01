const folderController = require("./folderController");

async function home(req, res) {
  res.render("index");
}

module.exports = {
  home,
};
