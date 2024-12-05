const express = require("express");
const router = express.Router();
const general = require("../generalFnc");


router.use(general.checkLogin);

const { galleri, galleriPage } = require("../controllers/galleryControllers");


router.route("/").get(galleri);

router.route("/:page").get(galleriPage);


module.exports = router;
