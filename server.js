// za³¹czenie paczek
var express = require('express');
var app 	= express();
var path 	= require("path");
var mysql   = require('mysql');
var router = express.Router();

var cookieParser = require('cookie-parser');

var session = require('express-session');


router.use(session({ secret: 'app', cookie: { maxAge: 1*1000*60*60*24*365 }}));
router.use(cookieParser());

app.set('view engine','ejs');
	var bodyParser = require('body-parser');

	app.use(bodyParser.urlencoded({ extended: true }));
 
	app.use(bodyParser.json());

var path = require("path");

app.use(express.static("public"));

// Inicjalizacja bazy danych 
var connection = mysql.createConnection({
    host: "jkpawlowski.nazwa.pl",

    port: 3306,

    user: "jkpawlowski_jakub",

    password: "mGjRD9hDT5X6GMR",

    database: "jkpawlowski_dieta"
});

var User = require('./routes/user.js');
app.use('/', User);


// miejsce na za³¹czanie api  


// licznik 
global.getTime = function() {
	var timeStamp = new Date();
	var startTime = timeStamp.getDate() + "/"
                + (timeStamp.getMonth()+1)  + "/" 
                + timeStamp.getFullYear() + " @ "  
                + timeStamp.getHours() + ":"  
                + timeStamp.getMinutes() + ":" 
                + timeStamp.getSeconds();

    return startTime;
}

//b³edy konsoli
global.addRouteInfo = function(req, url) {

	if((typeof req.session.routerInfo != 'undefined') && (typeof url == 'undefined')) {
		req.session.routerInfo.push({route: req.originalUrl, time: getTime()});
		return true;
	} else if ((typeof req.session.routerInfo != 'undefined') && (typeof url != 'undefined')) {
		req.session.routerInfo.push({route: url, time: getTime()});
		return true;
	} else return false;
}

// wys³anie na port 3000
app.listen(3000, function(){
	console.log('listening on 3000');
});

















































