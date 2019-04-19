var mysql 		= require("mysql");
var express 	= require('express');
var app 		= express();
var path 		= require("path");
var bcrypt 		= require('bcryptjs');
var router  	= express.Router();

	var bodyParser = require('body-parser');

	app.use(bodyParser.urlencoded({ extended: true }));

    app.use(bodyParser.json());

	var cookieParser = require('cookie-parser');

	var session = require('express-session');

	router.use(session({ secret: 'app', cookie: { maxAge: 1*1000*60*60*24*365 }}));

	router.use(cookieParser());

// Inicjalizacja bazy danych 
var connection = mysql.createConnection({
	host: "localhost",

	port: 3306,

	user: "root",

    password: " ",

	database: "opt_diet"
});

router.use(express.static("../public"));

 //odnoœniki 
router.get('/', function(req, res) {
	addRouteInfo(req);
	console.log(req.session.routerInfo);
	res.render("pages/home", {req: req.session.user_id});
});

//logowania
router.get('/loginPage', function(req,res) {
	res.render("pages/login", {req: req.session.user_id});
});


router.get('/loginPage/:nextRoute/:isbn', function(req,res) {

	console.log(req.params.nextRoute, 'line 62');
	res.render("pages/login", {req: req.session.user_id, nextRoute: req.params.nextRoute, isbn: req.params.isbn});
});

// rejestracji
router.get('/registerPage', function(req,res) {
	res.render('pages/register', {req: req.session.user_id});
})

router.post('/register', function(req,res) {

	if(req.body.name == '' || req.body.email == '' || req.body.username == '') {
		res.render('pages/register', {req: req.session.user_id, noInput: true})
	}
	else {
		bcrypt.genSalt(10, function(err, salt) {
			bcrypt.hash(req.body.password, salt, function(err, p_hash) {
				
				connection.query('INSERT INTO user (name, Email, login, password) VALUES (?, ?, ?, ?)', [req.body.name, req.body.email, req.body.username, p_hash], function (error, results, fields) {
					
					// email is unique in db so, error if there is already email in use
					if(error) res.render('pages/register', {req: req.session.user_id, error: true});
					else res.render('pages/login', {req: req.session.user_id});
				});
			});
		});
	}
});

router.post('/login', function(req,res) {
	loginAuth(req, res, '')	
})

router.post('/login/:route/:isbn', function(req,res) {

	var url = req.params.route+'?'+req.params.isbn;
	var finalUrl = url.split(' ').join('');
	loginAuth(req, res, finalUrl);
})

//wylogowania
router.get('/logout', function(req,res) {

	var info = JSON.stringify(req.session.routerInfo);
	var start = req.session.logInTime;
	var end = getTime();
	var time = start + ' - ' + end;
	var text = '';

	console.log(info);
	for(var i = 0; i < info.length; i++ ) {
		text += info[i];
	}

	var query = "INSERT INTO userSession(user_id, routes, sessionTime) values ('"+req.session.user_id+"', '"+text+"', '"+time+"')"

	connection.query(query, function(error, results, fields) {
		req.session.destroy(function(err) {
			if(err) console.log(err);
			res.render('pages/logout.ejs', {req: null});
		})
	})
});


function loginAuth(req, res, url) {
	
	if(req.body.email == '') {
		
		if(url != '') {
			redirectToPostings(res, url)
		} else {
			res.render('pages/login', {req: req.session.user_id, noInput: true});
		}
	} else {
		loginAuthQuery(req, res, url);
	}
}

function loginAuthQuery(req, res, url) {
	
	connection.query('SELECT * FROM users WHERE email = ?', [req.body.email], function(error, results, fields) {
		
		if (results.length == 0 || error) {
			if(url != ''){

				redirectToPostings(res, url)
			} else {
				res.render('pages/login', {req: req.session.user_id, error: true, email: true});
			}
		} else {
			
		  	bcrypt.compare(req.body.password, results[0].password, function(err, result) {

		  	    if (result == true) {
		  	    	req.session.user_id = results[0].id;
		  	      	req.session.email = results[0].email;
		  	      	req.session.routerInfo = [];
		  	      	req.session.logInTime = getTime();
		  	      	if(url == '') {
		  	      		addRouteInfo(req);
		  	      	} else {
		  	      		addRouteInfo(req, '/'+url);
		  	      	}
		  	      	
		  	      	res.redirect('/'+url);

		  	    } else if(url != '') {

		  	    	redirectToPostings(res, url)
		  	    } else {
		  	      	res.render('pages/login', {req: req.session.user_id, error: true, email: true});
		  	    }
		  	});
		}
	});
}

function redirectToPostings(res, url) {
	var queryStr = url.split("?")[1];
	var queryArray = queryStr.split("&");
	var searchTerm = queryArray[0].split("=")[1];
	
	res.redirect('/loginPage/searchResults/searchterms='+searchTerm);
}

module.exports = router;








