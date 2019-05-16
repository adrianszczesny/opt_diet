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
    host: "jkpawlowski.nazwa.pl",

    port: 3306,

    user: "jkpawlowski_jakub",

    password: "mGjRD9hDT5X6GMR",

    database: "jkpawlowski_dieta"
});
router.use(express.static("../public"));

 //odnosniki 
router.get('/', function(req, res) {
	addRouteInfo(req);
	console.log(req.session.routerInfo);
	res.render("pages/home", {req: req.session.ID});
});

router.get('/ui', function (req, res) {
    res.render('pages/ui', { req: req.session.ID });
})

//logowania
router.get('/loginPage', function(req,res) {
	res.render("pages/login", {req: req.session.ID});
});


// rejestracji
router.get('/registerPage', function(req,res) {
	res.render('pages/register', {req: req.session.ID});
})

router.post('/register', function(req,res) {

    if (req.body.UserName == '' || req.body.Password == '') {
		res.render('pages/register', {req: req.session.ID, noInput: true})
	}
	else {
		bcrypt.genSalt(10, function(err, salt) {
			bcrypt.hash(req.body.Password, salt, function(err, p_hash) {
				
				connection.query('INSERT INTO Users (UserName, Password) VALUES (?, ?)', [req.body.UserName, p_hash], function (error, results, fields) {
					
                    // unikatowy login
                    if (error) res.render('pages/register', { req: req.session.ID, error: true });
					else res.render('pages/login', {req: req.session.ID});
				});
			});
		});
	}
});

router.post('/login', function(req,res) {
	loginAuth(req, res, '')	
})

//wylogowania
router.get('/logoutPage', function (req, res) {
    res.render('pages/logout', { req: req.session.ID });
})

router.post('/logout', function(req,res) {

	connection.query(query, function(error, results, fields) {
		req.session.destroy(function(err) {
			if(err) console.log(err);
			res.render('pages/logout.ejs', {req: null});
		})
	})
});

router.get('/resultPage', function (req, res) {
    res.render('pages/dietresult', { req: req.session.ID });
}};

router.post('/result', function (req, res) {
    dietResult(req, res, '')
})

function dietResult(req, res, url) {
    let lak = 3, weg = 3, glu = 3;
    if (req.body.laktoza = true) lak = 1;
    if (req.body.wege = true) weg = 1;
    if (req.body.gluten = true) glu = 1;

    let produkty = [];
    let cena = [];
    let a = [];
    let b = [];

    connection.query('SELECT Ingredients.ID, Limits.Daily, Ingredients.KcalPerG, Products.Price100 FROM Limits INNER JOIN Ingredients ON Limits.IngredientID = Ingredients.ID INNER JOIN Products ON Ingredients.ID = Products.IngridientID WHERE (Ingredients.Gluten <> ? ) AND (Ingredients.Lactose <> ? ) AND (Ingredients.Vege <> ? ) ', [glu, lak, weg], function (error, results, fields) {
        //zerowanie tablicy a
        for (let i = 0; i < 2 + 2 * results.length; i++) {
            for (let j = 0; j < results.length; j++) {
                a[i][j] = 0;
            }
        }
        //podstawa tablicy a
        i = 2;
        for (j = 0; j < results.length; j++) {
            a[i][j] = -1;
            i++;
            a[i][j] = 1;
            i++;
        }

        //wartosci kcal do tablicy a
        for (j = 0; j < results.length; j++) {
            a[0][j] = results[j].KcalPerG;
        }
        for (j = 0; j < results.length; j++) {
            a[1][j] = -results[j].KcalPerG;
        }

        //ograniczenia diety do tablicy b
        b[0] = body.minKcal;
        b[1] = body.maxKcal;

        //dzienne ograniczenia do tablicy b
        j = 0;
        for (i = 2; i < 2 + 2 * results.length; i++) {
            b[i] = 0;
            i++;
            b[i] = results[j].Daily;
            j++;
        }
        //wstawienie listy produktow do tablicy produkty
        for (i = 0; i < results.length; i++) {
            produkty[i] = results[i].ID;
        }

        //wstawienie ceny w tabele cena
        for (i = 0; i < results.length; i++) {
            cena[i] = -results[i].Price100;
        }
    })

    //przeliczenie
    let lp = numeric.solveLP(cena, a, b);
   let solution = numeric.trunc(lp.solution, 1e-4);
}


function loginAuth(req, res, url) {

    if (req.body.UserName == '') {
		
		if(url != '') {
			redirectToPostings(res, url)
		} else {
			res.render('pages/login', {req: req.session.ID, noInput: true});
		}
	} else {
		loginAuthQuery(req, res, url);
	}
}

function loginAuthQuery(req, res, url) {
	
	connection.query('SELECT * FROM Users WHERE UserName = ?', [req.body.UserName], function(error, results, fields) {
		
		if (results.length == 0 || error) {
			if(url != ''){

				redirectToPostings(res, url)
			} else {
				res.render('pages/login', {req: req.session.ID, error: true, email: true});
			}
		} else {
			
		  	bcrypt.compare(req.body.Password, results[0].Password, function(err, result) {

		  	    if (result == true) {
		  	    	req.session.ID = results[0].ID;
		  	      	req.session.UserName = results[0].UserName;
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
                        res.render('pages/login', { req: req.session.UserName, error: true, email: true });
		  	    }
		  	});
		}
	});
}

module.exports = router;








