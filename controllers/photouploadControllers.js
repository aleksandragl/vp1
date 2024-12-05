const mysql = require("mysql2");
const dbInfo = require("../../../vp2024config");
const sharp = require("sharp");
const fs = require("fs");
const multer = require("multer");
const upload = multer({ dest: "./public/Gallery/orig/" });

const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.passWord,
	database: dbInfo.configData.dataBase
});




const photoupload = (req, res)=>{
	res.render("photoupload",{ notice: "",firstName: req.session.firstName,lastName: req.session.lastName }); //
};

const addingPhoto = (req, res)=>{   //app.post("/photoupload", upload.single("photoInput"),
	let notice = ""; //
	console.log(req.body);
	console.log(req.file);
	//genereerimi oma failinime
	 	//
	
	if (!req.file) {  // 
    notice = "faili pole valitud"; //
    return res.render("photoupload", { notice: notice }); //
	
}
	if (!req.body.altInput || req.body.altInput === "") { //
    notice = "kirjeldus puudub";                            ////
    return res.render("photoupload", { notice: notice }); //

}
	const fileName = "vp_" + Date.now() + ".jpg";
	//nimetame üleslaetud faili ümber
	fs.rename(req.file.path, req.file.destination + fileName, (err)=>{
		console.log(err);
									//notice = "Pildi üleslaadimisel tekkis viga.";//
									//return res.render("photoupload", { notice: notice }); //
	
	});	
	//teeme 2 erisuurust
	sharp(req.file.destination + fileName).resize(800,600).jpeg({quality: 90}).toFile("./public/Gallery/normal/" + fileName);
	sharp(req.file.destination + fileName).resize(100,100).jpeg({quality: 90}).toFile("./public/Gallery/thumb/" + fileName);
	//salvestame andmebaasis
	let sqlReq = "INSERT INTO photos (file_name, orig_name, alt_text, privacy, user_id) VALUES(?,?,?,?,?)";
	const userId = req.session.userId; /////muudetud 19.11
	conn.query(sqlReq, [fileName, req.file.originalname, req.body.altInput, req.body.privacyInput, userId], (err, result)=>{
		if(err){
			throw err; 				//notice = "Pildi üleslaadimisel tekkis viga.";//
									//return res.render("photoupload", { notice: notice }); //
		}
		else {
			notice = "pilt on üles laaditud!";//
			res.render("photoupload", { notice: notice,firstName: req.session.firstName,lastName: req.session.lastName }); //firstName: req.session.firstName,lastName: req.session.lastName
		}
	});
};


module.exports = { photoupload, addingPhoto };
