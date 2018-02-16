var express = require('express'),
    app = express();
var Session = require('express-session');
var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var plus = google.plus('v1');
/* Server */
const ClientId = "157070268205-9aoeducppastv4rae5e9o06tf4musn6k.apps.googleusercontent.com";
const ClientSecret = "W3axWTf_SRvMSKi2e95Mohzf";
const RedirectionUrl = "http://goldmantimes.com/oauth2callback";
/* Local */
/*const ClientId = "157070268205-akqlv3j1gaideq03hasvj835r48j59l8.apps.googleusercontent.com";
const ClientSecret = "aqY-HGp7VyWmrmyFXESw_6mt";
const RedirectionUrl = "http://localhost:8081/oauth2callback";*/
//using session in express
app.use(Session({
    secret: 'FNpWsC0p158AP21',
    resave: true,
    saveUninitialized: true,
}));

var exphbs = require('express-handlebars');
var hbs = require('hbs'); 
var fs = require('fs');
var path = require('path');
var Handlebars = require('handlebars');
var paginate = require('handlebars-paginate');
app.use(express.static(__dirname + '/views'));
Handlebars.registerHelper('paginate', paginate);
Handlebars.registerHelper('equal', function(lvalue, rvalue, options) {
    if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
    if( lvalue!=rvalue ) {
        return options.inverse(this);
    } else {
        return options.fn(this);
    }
});
Handlebars.registerHelper('equalArrayString', function(array, string, options) {
    if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
    for (var i = 0; i < array.length; i++) {
      if( array[i]==string ) {
          return options.fn(this);
      }
    }
    return options.inverse(this);
});
Handlebars.registerHelper('checkPage', function(page, pageCount, postNumber, options) {
    if (arguments.length < 4)
        throw new Error("Handlebars Helper equal needs 2 parameters");
    if (page==1 && pageCount<postNumber) {
		return options.inverse(this);
    }
    else{
		return options.fn(this);
    }
});
Handlebars.registerHelper("log", function(something) {
	  console.log(something);
	});
util = require("util");
app.engine( 'handlebars', exphbs( { 
  extname: 'handlebars', 
  defaultLayout: 'index', 
  layoutsDir: path.join(__dirname + '/views/layouts/'),
  partialsDir: path.join(__dirname + '/views/articles/')
} ) );
app.set('view engine', 'handlebars');
app.set('port', process.env.PORT || 3000);

app.listen(8081, 'localhost');
var session;

process.on('uncaughtException', function (err) {
    console.log(err);
}); 

function getOAuthClient () {
    return new OAuth2(ClientId ,  ClientSecret, RedirectionUrl);
}

function getAuthUrl () {
    var oauth2Client = getOAuthClient();
    // generate a url that asks permissions for Google+ and Google Calendar scopes
    var scopes = [
      'https://www.googleapis.com/auth/plus.me',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    var url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes // If you only need one scope you can pass it as string
    });

    return url;
}

app.use("/oauth2callback", function (req, res) {
    var oauth2Client = getOAuthClient();
    session = req.session;
    var code = req.query.code; // the query param code
    oauth2Client.getToken(code, function(err, tokens) {
      // Now tokens contains an access_token and an optional refresh_token. Save them.
 
      if(!err) {
        oauth2Client.setCredentials(tokens);
        //saving the token to current session
        session["tokens"]=tokens;
        res.redirect('/');
      }
      else{
        res.send(`
            &lt;h3&gt;Login failed!!&lt;/h3&gt;
        `);
      }
    });
});
 
var route = require('./routes/routes')(getAuthUrl(),getOAuthClient(),plus);
app.use('/', route);

