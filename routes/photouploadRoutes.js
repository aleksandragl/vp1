const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "./public/Gallery/orig/" });
const { photoupload, addingPhoto } = require("../controllers/photouploadControllers");


router.route("/").get(photoupload);  
router.route("/").post(upload.single("photoInput"), addingPhoto);

module.exports = router;

