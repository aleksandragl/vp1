const mysql = require("mysql2");
const dbInfo = require("../../../vp2024config");
const dateTime = require("../dateTime");

const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.passWord,
	database: dbInfo.configData.dataBase
});

const async = require('async');

//@desc opening page
//@route GET /eestifilm
//@access public

const eestifilm = (req, res)=>{
	console.log("Sees on kasutaja: " + req.session.userId);
	res.render("filmindex");
};

//@desc film persons list
//@route GET /eestifilm
//@access public


const tegelased = (req, res)=>{
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
				persons.push({first_name: sqlres[i].first_name, last_name: sqlres[i].last_name,birth_date: dateTime.givenDateFormatted(sqlres[i].birth_date)});
			}
			res.render("tegelased", {persons: persons});
			
		}
	});
};


//@desc page for adding data
//@route GET eestifilm
//@access public

const lisa = (req, res)=>{ ///////////////////////////

    let notice = "";
    let firstName = "";
	let lastName = "";
	let birthDate = "";
    let title = "";
    let positionName = "";
	let productionYear = "";
	let description = "";
    res.render("3vorm", {notice: notice,firstName: firstName, lastName: lastName,title: title,positionName: positionName});
};

const addingPerson = (req, res) => {

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
};

const addingFilm = (req, res) => {
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
};

const addingRole = (req, res) => {
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
};


//@desc page for adding relations
//@route GET /eestifilm
//@access public

const lisaseos = (req, res)=>{
	let notice = "";
	//võtan kasutusele asyne mooduli et korraga teha mitu andmebaasipäringut
	const filmQueries = [
		function(callback){
			let sqlReq1 = "SELECT id, first_name, last_name, birth_date FROM person ";
			conn.execute(sqlReq1, (err, result)=>{
				if(err){
					return callback(err);
				}
				else {
					return callback(null, result);
				}
			});
		},
		function(callback){
			let sqlReq2 = "SELECT id, title, production_year FROM movie ";
			conn.execute(sqlReq2, (err, result)=>{
				if(err){
					return callback(err);
				}
				else {
					return callback(null, result);
				}
			});
		},
		function(callback){
			let sqlReq3 = "SELECT id, position_name FROM position ";
			conn.execute(sqlReq3, (err, result)=>{
				if(err){
					return callback(err);
				}
				else {
					return callback(null, result);
				}
			});
		},
		
	];
	
	//paneme need päringut ehk siis funktsioonid paralelselt käima,tulemuseks saame kolme päringu koondi
	async.parallel(filmQueries, (err, results)=>{
		if(err){
			throw err;
		}
		else{
			const personList = results[0];
            const movieList = results[1];
            const positionList = results[2]; 
			
			req.session.personList = personList;
            req.session.movieList = movieList;
            req.session.positionList = positionList;
			
            console.log(results); 
			
			res.render("addRelations", { personList, movieList, positionList, notice });                  /* {personList: results[0], movieList: results[1], positionList: results[2], notice: notice}); */
		}
	});
};	
const saveRelation = (req, res) => {
    const personId = req.body.personSelect;
    const movieId = req.body.movieSelect;
    const positionId = req.body.positionSelect;
    const role = req.body.roleInput || null;  
    const notice = "Seos salvestatud edukalt!";  

    
    if (!personId || !movieId || !positionId) {
        return res.send("Viga: kõik andmed pole sisestatud!");
    }

 
    let sqlReq = "INSERT INTO person_in_movie (person_id, movie_id, position_id, role) VALUES (?, ?, ?, ?)";
    conn.query(sqlReq, [personId, movieId, positionId, role], (err, result) => {
        if (err) {
            throw err;
        } else {
            console.log("Seos salvestatud: ", result.insertId);

           
            res.render("addRelations", {
                notice: notice,
                personList: req.session.personList,
                movieList: req.session.movieList,
                positionList: req.session.positionList
            });
        }
    });
};

module.exports = {
    eestifilm,
    tegelased,
    lisa,
    addingPerson,
    addingFilm,
    addingRole,
	lisaseos,
	saveRelation
};