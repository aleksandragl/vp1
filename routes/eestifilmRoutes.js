const express = require("express");
const router = express.Router();
const general = require("../generalFnc");

const {
    eestifilm,
    tegelased,
    lisa,
    addingPerson,
    addingFilm,
    addingRole,
	lisaseos,
	saveRelation
} = require("../controllers/eestifilmControllers");

router.use(general.checkLogin);

router.route("/").get(eestifilm);

router.route("/tegelased").get(tegelased);

router.route("/lisa").get(lisa);

router.route("/addperson").post(addingPerson);

router.route("/addfilm").post(addingFilm);

router.route("/addrole").post(addingRole);

router.route("/lisaseos").get(lisaseos);

router.route("/lisaseos").post(saveRelation);

module.exports = router;