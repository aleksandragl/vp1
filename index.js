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
//sessionihaldur
const session = require("express-session");
const async = require("async");

const app = express();
app.use(session({secret: "koer", saveUninitialized: true, resave: true}));
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

const checkLogin = function(req, res, next){
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




//uudiste osa eraldi marsruutide failiga

//Eesti film osa eraldi ruuteriga


const eestifilmRouter = require("./routes/eestifilmRoutes");
app.use("/eestifilm", eestifilmRouter);

const newsRouter = require("./routes/newsRoutes");
app.use("/news", newsRouter);

const galleryRouter = require("./routes/galleryRoutes");  
app.use("/gallery", galleryRouter);

const photouploadRouter = require("./routes/photouploadRoutes");
app.use("/photoupload", photouploadRouter);


app.get("/visitlogdb", (req, res) => {
    let sql = "SELECT first_name, last_name, visit_time FROM visitlog";
    conn.query(sql, (err, results) => {
        if (err) {
            throw err;
        }
        res.render("visitlogdb", { visitData: results });
    });
});


//uuuuus aasi !!!!!!!!!



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
		let sqlReq = "SELECT id, password, first_name, last_name FROM users WHERE email = ?";   //uuuuuut 19.11 //let sqlReq = "SELECT id, password FROM users WHERE email = ?";
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
								//notice = "Oled sisse loginud"; // 14.11
								//res.render("signin", {notice: notice});
								req.session.userId = result[0].id;
								req.session.firstName = result[0].first_name; // 19.11//////////
								req.session.lastName = result[0].last_name;   // 19.11/////////////
								res.redirect("/home");
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

app.get("/home", checkLogin, (req, res) => {
    console.log("Sees on kasutaja: " + req.session.userId);
    res.render("home", {
        firstName: req.session.firstName,
        lastName: req.session.lastName
    });
});

app.get("/logout", (req, res)=>{ ///////////////////uuuut 14.11       
	req.session.destroy();
	console.log("Välja loogitud");
	res.redirect("/");
});

app.get("/signup", (req, res)=>{ ////////////////////////////////uuuut 10.11          ////res.render("signup");
	res.render("signup", { notice: "",
		firstNameInput: req.query.firstNameInput || "", 
		lastNameInput: req.query.lastNameInput || "",
		birthDateInput: req.query.birthDateInput || "",
		emailInput: req.query.emailInput || ""});
});


app.post("/signup", (req, res)=>{
	let notice = "Ootan andmed";
	
	console.log(req.body);
	if(!req.body.firstNameInput || !req.body.lastNameInput || !req.body.birthDateInput || !req.body.genderInput || !req.body.emailInput || req.body.passwordInput.length < 8 || req.body.passwordInput !== req.body.confirmPasswordInput){
		console.log("Andmeid on puudu või paroolid ei kattu");
		notice = "Andmeid on puudu,parool liiga lühike või paroolid ei kattu";
		res.render("signup", {notice: notice,
						      firstNameInput: req.body.firstNameInput,
							  lastNameInput: req.body.lastNameInput,
							  birthDateInput: req.body.birthDateInput,
							  emailInput: req.body.emailInput }); 
	}//kui andmetes viga... lõpeb      /////////////////////////////////////10.11 ////////////////////////////////////////////////////
	else {
	    conn.execute("SELECT id FROM users WHERE email = ?", [req.body.emailInput], (err, results) => {
            if (err) {
                console.error("Viga olemasoleva kasutaja kontrollimisel:", err);
                notice = "Tehniline viga, proovige uuesti";
                res.render("signup", { notice: notice, 
					firstNameInput: req.body.firstNameInput,
					lastNameInput: req.body.lastNameInput,
					birthDateInput: req.body.birthDateInput,
					emailInput: req.body.emailInput }); /////////////////////// uuuut firstName, lastName, birthDate, emailInput
            } else if (results.length > 0) {
                // 
                notice = "Kasutaja sellise e-mailiga on juba olemas.";
				res.render("signup", { notice: notice,
					firstNameInput: req.body.firstNameInput,
					lastNameInput: req.body.lastNameInput,
					birthDateInput: req.body.birthDateInput,
					emailInput: req.body.emailInput}); /////////////////////// uuuut firstName, lastName, birthDate, emailInput,
            } else {       ///////////////////////////////////////////////////////////////////////////////////////////////////////////////
					notice = "Andmed korras!";
					//loome parooli räsi jaoks "soola"
					bcrypt.genSalt(10, (err, salt)=> {
						if(err){
							notice = "Tehniline viga parooli krüpteerimisel, kasutajat ei loodud";
							res.render("signup", {notice: notice, 
								firstNameInput: req.body.firstNameInput,
								lastNameInput: req.body.lastNameInput,
								birthDateInput: req.body.birthDateInput,
								emailInput: req.body.emailInput});
						}
					else {
						//krüpteerime
						bcrypt.hash(req.body.passwordInput, salt, (err, pwdHash)=>{
							if(err){
								notice = "Tehniline viga parooli krüpteerimisel, kasutajat ei loodud";
								res.render("signup", {notice: notice, 
									firstNameInput: req.body.firstNameInput,
									lastNameInput: req.body.lastNameInput,
									birthDateInput: req.body.birthDateInput,
									emailInput: req.body.emailInput}); /////////////////////// uuuut firstName, lastName, birthDate, emailInput, 
							}
							else{
								let sqlReq = "INSERT INTO users (first_name, last_name, birth_date, gender, email, password) VALUES(?, ?, ?, ?, ?, ?)";
								console.log(req.body.firstNameInput + " " + req.body.lastNameInput + " " + req.body.birthDateInput + " " + req.body.genderInput + " " + req.body.emailInput + " " + pwdHash);
								conn.execute(sqlReq, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthDateInput, req.body.genderInput, req.body.emailInput, pwdHash], (err, result)=>{
									if(err){
										notice = "Tehniline viga andmebaasi kirjutamisel,kasutajat ei loodud";
										res.render("signup", {notice: notice, 
											firstNameInput: req.body.firstNameInput,
											lastNameInput: req.body.lastNameInput,
											birthDateInput: req.body.birthDateInput,
											emailInput: req.body.emailInput}); /////////////////////// uuuut firstName, lastName, birthDate, emailInput, 
									}
									else {
										notice = "Kasutaja " + req.body.emailInput + "edukalt loodud!";
										res.render("signup", {notice: notice,
											firstNameInput: req.body.firstNameInput,
											lastNameInput: req.body.lastNameInput,
											birthDateInput: req.body.birthDateInput,
											emailInput: req.body.emailInput});
									}
                                }); //conn.execute lõpp
                            }
                        }); //bcrypt.hash lõppeb
                    }
                }); //bcrypt.genSalt lõppeb
            } //kui andmed korras, lõppeb
        }); //conn.execute lõppeb
    } //else lõppeb
}); //app.post lõppeb




app.listen(5112);
