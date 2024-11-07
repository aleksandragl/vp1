const express = require("express");
const dtEt= require("./dateTime");
const fs = require("fs");
const dbInfo = require("../../vp2024config");
const mysql = require("mysql2");
//päringu lahtiharutamiseks POST päringute puhul
const bodyparser = require ("body-parser");
//failide üleslaadimiseks
const multer = require("multer");
//pildimanipalutsiookis (suuruse muutmine)
const sharp = require("sharp");
//parooli krüpteerimiseks
const bcrypt = require("bcrypt");

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyparser.urlencoded({extended: true}));
//seadistame vahevara multer fotode laadimiseks kindlasse kataloogi
const upload = multer({dest: "./public/Gallery/orig/"});


//loon andmebaasiühenduse
const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.passWord,
	database: dbInfo.configData.dataBase
});



app.get("/", (req,res) => {
const semStartDate = new Date("2024-09-02")
const today = new Date()
const todayS = new Date().toISOString().split('T')[0];
const timeDifference = today - semStartDate
const dateDifference = Math.floor(timeDifference / (1000 * 60 * 60 *24))
console.log(`time dif: ${timeDifference}\ndate dif ${dateDifference}`)
	
const sqlreq = "SELECT news_title, news_text, news_date FROM news WHERE expire_date >= ? ORDER BY id DESC LIMIT 1"; //uuus 29.10
	conn.query(sqlreq, [todayS], (err, results) => {
		if (err) {
			throw err;
		} 
        console.log(results);
	
		res.render("index.ejs", {dateDifference: dateDifference, news: results[0]});
	});
});

//KORRAN
//app.get("/", (req, res)=>{
	//res.send("Express läks täiesti käima");
	//res.render("index.ejs");
//});




app.get("/timenow", (req, res)=>{
	const weekdayNow = dtEt.weekDayEt();
	const dateNow = dtEt.dateEt();
	const timeNow = dtEt.currentTime();
	res.render("timenow",{nowWD: weekdayNow, nowD: dateNow, nowT: timeNow});
});

app.get("/vanasonad", (req, res)=>{
	let folkWisdom = [];
	fs.readFile("public/textfiles/vanasonad.txt", "utf8", (err, data)=>{
		if(err){
		//throw err;
		res.render ("justlist", {h2: "Vanasõnad", listData: ["Ei leidnud ühtegi vanasõna"]});
		}
		else {
			folkWisdom = data.split(";");
			res.render ("justlist", {h2: "Vanasõnad", listData: folkWisdom});
		}
	});
});

app.get("/visitlog", (req, res)=>{
	
	fs.readFile("public/textfiles/visitlog.txt", "utf8", (err, data) => {
		if (err) {
			res.render("visitlog", { h2: "Külastuste logi", listData: ["Ei suutnud faili lugeda"] });
		} else {
			const visits = data.trim().split(";");
			res.render("visitlog", { h2: "Külastuste logi", listData: visits });
		}
    });
});

app.get("/regvisit", (req, res)=>{
	//res.send("Express läks täiesti käima");
	res.render("regvisit");
});

app.post("/regvisit", (req, res)=>{
	console.log(req.body);
	fs.open("public/textfiles/visitlog.txt", "a", (err,file)=>{
		if(err){
			throw err;
		}
		else {
			fs.appendFile("public/textfiles/visitlog.txt", `;${req.body.firstNameInput} ${req.body.lastNameInput} ${new Date ().toLocaleDateString()} 
			${new Date().toLocaleTimeString()}`,(err)=>{
				if(err){
					throw err;
				}
				else {
					console.log("Faili kirjutati");
					res.render("regvisit");
				}
			});
		}
	});

	
});

app.get("/regvisitdb", (req, res)=>{
	let notice = "";
	let firstName = "";
	let lastName = "";
	res.render("regvisitdb", {notice: notice,firstName: firstName, lastName: lastName});
});	

app.post("/regvisitdb", (req, res)=>{
	let notice = "";
	let firstName = "";
	let lastName = "";
	
	if(!req.body.firstNameInput || !req.body.lastNameInput){
		firstName = req.body.firstNameInput;
		lastName = req.body.lastNameInput;
		notice = "Osa andmeid sisestamata";
		res.render("regvisitdb", {notice: notice,firstName: firstName, lastName: lastName});
	}
	else {
		let sqlreq = "INSERT INTO visitlog (first_name, last_name) VALUES(?,?)";
		conn.query(sqlreq, [req.body.firstNameInput, req.body.lastNameInput], (err, sqlres)=>{
			if(err){
				throw err;
			}
			else{
				notice = "Külastus registreeritud";
				res.render("regvisitdb", {notice: notice,firstName: firstName, lastName: lastName});
			}
		});
	}
});

app.get("/eestifilm", (req, res)=>{
	res.render("filmindex");
});	

app.get("/eestifilm/tegelased", (req, res)=>{
	let sqlReq = "SELECT first_name, last_name, birth_date FROM person";
	let persons = [];
	conn.query(sqlReq, (err, sqlres)=>{
		if(err){
			throw err;
		}
		else {
			console.log(sqlres);
		
			//persons = sqlres;     uuuus 17.10
			//for   i   algab  0 piiriks sqlres.length
			//tsükli sees lisame persons listile uue elemendi,mis on ise "object"{first_name: sqlres[i].first_name}
			//listi liisamiseks on käsk
			//push.persons(lisatav element);
			for (let i = 0; i < sqlres.length; i ++){
				persons.push({first_name: sqlres[i].first_name, last_name: sqlres[i].last_name,birth_date: dtEt.givenDateFormatted(sqlres[i].birth_date)});
			}
			res.render("tegelased", {persons: persons});
			
		}
	});
	//res.render("tegelased");
});

/////uuuuus 17.10 on vaja veel lisada

// UUUUUS 29.10
app.get("/addnews", (req, res)=>{
	const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 10);
    const expDate = futureDate.toISOString().split('T')[0];

    
    res.render("addnews", { expDate: expDate });
});

app.post("/addnews", (req, res)=>{
	let notice = "";
	let titleNotice = "";
	let newsNotice = "";
	let title = req.body.titleInput;
	let news = req.body.newsInput;
	let expire = req.body.expireInput;
	
	
	 
	if (!title || !news || !expire) {
		 notice = "Osa andmeid sisestamata";
		}
	if (title.length < 3) {
		titleNotice = "Pealkiri pikkus peab olema vähemalt 3 märki"
	}
	if (news.length < 10) {
		newsNotice = "Sisu pikkus peab olema vähemalt 10 märki"
	}
	 if (notice || titleNotice || newsNotice){
		 res.render("addnews",{ notice, titleNotice, newsNotice ,title,news,expDate,expDate })
	}else{
		let sqlreq = "INSERT INTO news (news_title, news_text, news_date, expire_date, user_id) VALUES (?, ?, current_timestamp(), ?, 1)";		
		console.log("Sisestatud:", title, news, expire);
		conn.query(sqlreq, [title, news, expire], (err) => {
            if (err) {
                throw err;
            }
            notice = "Uudis salvestatud";
            res.render("addnews", { notice, titleNotice, newsNotice, title, news, expDate: expire });
		});
    }
});

app.get("/news", (req, res) => {
	const today = new Date().toISOString().split('T')[0];
    const sqlReq = "SELECT news_title, news_text, news_date, expire_date FROM news WHERE expire_date >= ? ORDER BY id DESC";

    conn.query(sqlReq, [today], (err, results) => {
        if (err) {
            throw err;
        } else {
			console.log(results);
            res.render("news", { news: results });
        }
    });
});



//uus asi!!!!!!!!!29.10

//uus asi!!!!!!!!!16.10
app.get("/visitlogdb", (req, res) => {
    let sql = "SELECT first_name, last_name, visit_time FROM visitlog";
    conn.query(sql, (err, results) => {
        if (err) {
            throw err;
        }
        res.render("visitlogdb", { visitData: results });
    });
});


app.get("/3vorm", (req, res) => {
    let notice = "";
    let firstName = "";
	let lastName = "";
	let birthDate = "";
    let title = "";
    let positionName = "";
	let productionYear = "";
	let description = "";
    res.render("3vorm", {notice: notice,firstName: firstName, lastName: lastName,title: title,positionName: positionName});
});

app.post("/addperson", (req, res) => {

        let notice = "";
	    let firstName = "";
	    let lastName = "";
		let birthDate = ""; //on vaja kirjutada nagu 2001.03.04
        if(req.body.personSubmit ){
		firstName = req.body.firstName;
		lastName = req.body.lastName;
		birthDate = req.body.birthDate;
        if (!firstName || !lastName) {
		    notice = "Osa andmeid sisestamata";
		    res.render("3vorm", {notice: notice,firstName: firstName, lastName: lastName});
        }
        else{ 
            let sqlreq = "INSERT INTO person (first_name, last_name, birth_date) VALUES (?,?,?)";
            conn.query(sqlreq, [req.body.firstName, req.body.lastName, req.body.birthDate], (err, sqlres)=>{
                if (err) {
                    throw err;
                } else {
                    notice = "Tegelane lisatud";
                    res.render("3vorm", { notice: notice, firstName: firstName, lastName: lastName,birthDate: birthDate });
                }
            });
        }
    }
});

app.post("/addfilm", (req, res) => {
    let title = "";
    let notice = "";
	let productionYear = "";
	let duration = "";
	let description = "";
    if (req.body.filmSubmit) {
        title = req.body.title;
		productionYear = req.body.productionYear; 
		duration = req.body.duration;
		description = req.body.description;
        if (!title || !productionYear || !duration || !description) {
            notice = "Osa andmeid sisestamata";
            res.render("3vorm", { notice: notice });
        } else {
            let sqlReq = "INSERT INTO movie (title, production_year,duration,description) VALUES (?,?,?,?)";
            conn.query(sqlReq, [req.body.title, req.body.productionYear,req.body.duration,req.body.description], (err, sqlres) => {
                if (err) {
                    throw err;
                } else {
                    notice = "Film lisatud";
                    res.render("3vorm", { notice: notice, title: title,productionYear: productionYear,duration: duration,description: description});
                }
            });
        } 
    }
 });

app.post("/addrole", (req, res) => {
    let positionName = "";
    let notice = "";
	let description = "";
    
    if (req.body.roleSubmit) {
        positionName = req.body.positionName;
	    description = req.body.description
        if (!positionName|| !description) {
            notice = "Osa andmeid sisestamata";
            res.render("3vorm", { notice: notice });
        } else {
            let sqlReq = "INSERT INTO `position` (position_name,description) VALUES (?,?)";
            conn.query(sqlReq, [positionName,description], (err, sqlres) => {
                if (err) {
                    throw err;
                } else {
                    notice = "Roll lisatud";
                    res.render("3vorm", { notice: notice, positionName: positionName,description: description });
                }
            });
        }
    }
});

//uuuuus aasi !!!!!!!!!

app.get("/photoupload", (req, res)=>{
	res.render("photoupload",{ notice: "" }); //
});

app.post("/photoupload", upload.single("photoInput"), (req,res)=>{
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
	const userId = 1;
	conn.query(sqlReq, [fileName, req.file.originalname, req.body.altInput, req.body.privacyInput, userId], (err, result)=>{
		if(err){
			throw err; 				//notice = "Pildi üleslaadimisel tekkis viga.";//
									//return res.render("photoupload", { notice: notice }); //
		}
		else {
			notice = "pilt on üles laaditud!";//
			res.render("photoupload", { notice: notice }); //
		}
	});
	//res.render("photoupload");
});

app.get("/gallery", (req, res)=>{
	let sqlReq = "SELECT file_name, alt_text FROM photos WHERE privacy = ? AND deleted IS NULL ORDER BY id DESC";
	const privacy = 3;
	let photoList = [];
	conn.query(sqlReq, [privacy], (err, result)=>{
		if(err){
			throw err;
		}
		else {
			console.log(result);
			for(let i = 0; i < result.length; i ++) {
				photoList.push({href: "/Gallery/thumb/" + result[i].file_name, alt: result[i].alt_text});
			}
		
			res.render("gallery", {listData: photoList});
		}
	});
	//res.render("gallery");
});
//uuuut 07.11 14:40
app.get("/", (req, res)=>{
const semStartDate = new Date("2024-09-02")
const today = new Date()
const todayS = new Date().toISOString().split('T')[0];
const timeDifference = today - semStartDate
const dateDifference = Math.floor(timeDifference / (1000 * 60 * 60 *24))
console.log(`time dif: ${timeDifference}\ndate dif ${dateDifference}`)
	
const sqlreq = "SELECT news_title, news_text, news_date FROM news WHERE expire_date >= ? ORDER BY id DESC LIMIT 1"; //uuus 29.10
	conn.query(sqlreq, [todayS], (err, results) => {
		if (err) {
			throw err;
		} 
        console.log(results);
	
		res.render("index.ejs", {dateDifference: dateDifference, news: results[0], notice: notice});
	});
});

app.get("/signin", (req, res)=>{
		
		res.render("signin");

});

app.post("/signin", (req, res)=>{
	let notice = "";
	console.log(req.body);
	if(!req.body.emailInput || !req.body.passwordInput){
		console.log("Andmed puudu");
		notice = "Sisselogimise andmeid on puudu";
		res.render("signin", {notice: notice});
	}
	else {
		let sqlReq = "SELECT id, password FROM users WHERE email = ?";
		conn.execute(sqlReq, [req.body.emailInput], (err, result)=>{
			if(err){
				console.log("Viga andmebaasist lugemisel" + err);
				notice = "Tehniline viga,sisselogimisel ebaõnnestus";
				res.render("signin", {notice: notice});
			}
			else {
				if(result[0] != null){
					//kasutaja on olemas,kontrollime sisestatud parooli
					bcrypt.compare(req.body.passwordInput, result[0].password, (err, compareresult)=>{
						if(err){
							notice = "Tehniline viga,sisselogimisel ebaõnnestus";
							res.render("signin", {notice: notice});
						}
						else {
							//kas õige või vale parool
							if(compareresult){
								notice = "Oled sisse loginud";
								res.render("signin", {notice: notice});
							}
							else {
								notice = "Kasutajatunnus ja/või parool on vale";
								res.render("signin", {notice: notice});
							}
						}
					});
					
				}
				else {
					notice = "Kasutajatunnus ja/või parool on vale";
					res.render("index.ejs", {notice: notice});
				}
			}
		
		});//conn.execute lõppeb
	
	}
		//res.render("signup");
});


app.get("/signup", (req, res)=>{
	res.render("signup");
});

app.post("/signup", (req, res)=>{
	let notice = "Ootan andmed";
	console.log(req.body);
	if(!req.body.firstNameInput || !req.body.lastNameInput || !req.body.birthDateInput || !req.body.genderInput || !req.body.emailInput || req.body.passwordInput.length < 8 || req.body.passwordInput !== req.body.confirmPasswordInput){
		console.log("Andmeid on puudu või paroolid ei kattu");
		notice = "Andmeid on puudu,parool liiga lühike või paroolid ei kattu";
		res.render("signup", {notice: notice});
	}//kui andmetes viga... lõpeb
	else {
		notice = "Andmed korras!";
		//loome parooli räsi jaoks "soola"
		bcrypt.genSalt(10, (err, salt)=> {
			if(err){
				notice = "Tehniline viga parooli krüpteerimisel, kasutajat ei loodud";
				res.render("signup", {notice: notice});
			}
			else {
				//krüpteerime
				bcrypt.hash(req.body.passwordInput, salt, (err, pwdHash)=>{
					if(err){
						notice = "Tehniline viga parooli krüpteerimisel, kasutajat ei loodud";
						res.render("signup", {notice: notice});
					}
					else{
						let sqlReq = "INSERT INTO users (first_name, last_name, birth_date, gender, email, password) VALUES(?, ?, ?, ?, ?, ?)";
						console.log(req.body.firstNameInput + " " + req.body.lastNameInput + " " + req.body.birthDateInput + " " + req.body.genderInput + " " + req.body.emailInput + " " + pwdHash);
						conn.execute(sqlReq, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthDateInput, req.body.genderInput, req.body.emailInput, pwdHash], (err, result)=>{
							if(err){
								notice = "Tehniline viga andmebaasi kirjutamisel,kasutajat ei loodud";
								res.render("signup", {notice: notice});
							}
							else {
								notice = "Kasutaja " + req.body.emailInput + "edukalt loodud!";
								res.render("signup", {notice: notice});
							}
						});//conn.execute lõpp
					}
				});//hash lõppeb
			}
		}); //genSalt lõppeb
		
	}//kui andmed korras, lõppeb
	//res.render("signup");
});

app.listen(5112);
