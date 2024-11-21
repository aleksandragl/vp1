const express = require("express");
const router = express.Router();

//const general = require("../generalFnc");

const checkLogin = function(req, res, next){  ///failif generalFnc sama peaaegu
	if(req.session != null){
		if(req.session.userId){
			console.log("Login, sees kasutaja: " + req.session.userId);
			next();
		}
		else {
			console.log("login not detected");
			res.redirect("/signin");
		}
	}
	else {
		console.log("session not detected");
		res.redirect("/signin");
	}
}
//kõkidele marsruutidele ühine vahevara

router.use(checkLogin);

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