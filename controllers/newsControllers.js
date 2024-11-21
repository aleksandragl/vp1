const mysql = require("mysql2");
const dbInfo = require("../../../vp2024config");

const conn = mysql.createConnection({
	host: dbInfo.configData.host,
	user: dbInfo.configData.user,
	password: dbInfo.configData.passWord,
	database: dbInfo.configData.dataBase
});
//@desc home page for news section
//@route GET /news
//@access private

const newsHome = (req, res)=>{
	console.log("Töötab uudiste router");
	res.render("news")
};

//@desc page for adding news 
//@route GET /news/addnews
//@access private

const addNews =(req, res)=>{ ///news
	const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 10);
    const expDate = futureDate.toISOString().split('T')[0];

    
    res.render("addnews", { expDate: expDate,firstName: req.session.firstName,lastName: req.session.lastName });///firstName: req.session.firstName,lastName: req.session.lastName
};


//@desc adding news 
//@route POST /news/addnews
//@access private

const addingNews = (req, res)=>{ //news
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
		const userId = req.session.userId;			 ////uuuuut 19.11
		console.log("Sisestatud:", title, news, expire);
		conn.query(sqlreq, [title, news, expire], (err) => {
            if (err) {
                throw err;
            }
            notice = "Uudis salvestatud";
            res.render("addnews", { notice, titleNotice, newsNotice, title, news, expDate: expire,firstName: req.session.firstName,lastName: req.session.lastName });///firstName: req.session.firstName,lastName: req.session.lastName
		});
    }
};

//@desc pafe for reading news headings
//@route GET /news/shownews
//@access private


const newsHeadings = (req, res) => {
	const today = new Date().toISOString().split('T')[0];
    const sqlReq = "SELECT news_title, news_text, news_date, expire_date FROM news WHERE expire_date >= ? ORDER BY id DESC";

    conn.query(sqlReq, [today], (err, results) => {
        if (err) {
            throw err;
        } else {
			console.log(results);
            res.render("shownews", { news: results,firstName: req.session.firstName,lastName: req.session.lastName });////firstName: req.session.firstName,lastName: req.session.lastName
        }
    });
}; 

module.exports = {
	newsHome,
	addNews,
	addingNews,
	newsHeadings
};