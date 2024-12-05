const mysql = require("mysql2");
const dbInfo = require("../../../vp2024config");
const async = require("async");

const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.passWord,
	database: dbInfo.configData.dataBase
});

const galleri = (req, res)=> {
	res.redirect("/gallery/1");
};

const galleriPage = (req, res) => {
	let galleriLinks = "";
	let page = parseInt(req.params.page);
	if(page < 1){
		page = 1;
	}
	
	const photoLimit = 2; //5 oli
	let skip = 3; //10 oli
	const privacy = 3;
	
	//teeme päringut mida tuleb kindlalt üksteise järel teha
	const galleriPageTasks = [
		function(callback){
			conn.execute("SELECT COUNT(id) as photoCountt FROM photos WHERE privacy = ? AND deleted IS NULL", [privacy], (err, result) => {
				if(err){
					return callback(err);
				}
				else {
					return callback(null, result);
				}
			});
		},
		function(photoCount, callback){
			console.log("Fotosid on: " + photoCount[0].photoCountt);
			if((page - 1)* photoLimit >= photoCount[0].photoCountt){
				page = Math.ceil(photoCount[0].photoCountt / photoLimit)
			}
			console.log("Lehekülg on: " + page);
			//linglid oleksid
			//<a href="/gallery/1">eelmine leht</a>  |  <a href="/gallery/3">järgmine leht</a> 
			if(page == 1) {
				galleriLinks = "eelmine leht &nbsp;&nbsp;&nbsp;| &nbsp;&nbsp;&nbsp;"
			}
			else {
				galleriLinks = '<a href="/gallery/' + (page - 1) + '"> eelmine leht &nbsp;&nbsp;&nbsp;| &nbsp;&nbsp;&nbsp;';
			}
			if(page * photoLimit >= photoCount[0].photoCountt){
				galleriLinks += "järgmine leht";
			}
			else {
				galleriLinks += '<a href="/gallery/' + (page + 1) + '"> järgmine leht</a>';
			}
			
			return callback(null, page);
		}
	];
	//async waterfall
	async.waterfall(galleriPageTasks, (err, results)=>{
		if(err){
			throw err;
		}
		else {
			console.log(results);
		}
	});
	/* //kui aadressis toodud lk on muudetud oli vigane,siis ....
	console.log(req.params.page);
	if(page != parseInt(req.params.page)){
		console.log("LK muutus!!");
		res.redirect("/gallery/" + page);
	} */
	skip = (page - 1)* photoLimit;
    let sqlReq = "SELECT file_name, alt_text FROM photos WHERE privacy = ? AND deleted IS NULL ORDER BY id DESC LIMIT ?,?";
    
    let photoList = [];
    conn.execute(sqlReq, [privacy, skip, photoLimit], (err, result) => {
        if (err) {
            throw err;
        } else {
            console.log(result);
            for (let i = 0; i < result.length; i++) {
                photoList.push({
                    href: "/Gallery/thumb/" + result[i].file_name,
                    alt: result[i].alt_text,
                    fileName: result[i].file_name
                });
            }
            res.render("gallery", {
                listData: photoList,
                firstName: req.session.firstName,
                lastName: req.session.lastName,
				links: galleriLinks
            });
        }
    }); 
}; 

module.exports = { galleri, galleriPage };