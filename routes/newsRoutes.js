const express = require("express");
const router = express.Router();
const general = require("../generalFnc");


//kõkidele marsruutidele ühine vahevara

router.use(general.checkLogin);

//kontrollime kontrollid
const {
	newsHome,
	addNews,
	addingNews,
	newsHeadings } = require("../controllers/newsControllers");
	
//igale marsruutile oma nagu seni index failis

//app.get("/news"), (req, res)=>{

router.route("/").get(newsHome);


router.route("/addnews").get(addNews);

router.route("/addnews").post(addingNews);

router.route("/shownews").get(newsHeadings);

module.exports = router;