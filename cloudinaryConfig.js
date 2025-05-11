const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: "phantompain",
  api_key: "954157513898344",
  api_secret: "sBdGH_L_ireh-cStgQRW58kTtrA",
});
console.log(cloudinary.config().cloud_name);
module.exports = cloudinary;
