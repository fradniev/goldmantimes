var express = require('express').Router();
var router = express;
var path = require('path');
var bodyParser = require('body-parser');
var https = require('https');
var fs = require('fs');
var util = require("util");
// Router functions here, as normal; each of these
// run only on requests to the server
var content=[];
var mainCount;
var postperpage=100;
var months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
var body=[];
var dataCount;
var i;
var oauthUrl;
var oauth2Client;
var plus;
var owner=[ 'lucasagudiez@gmail.com','xerdrein@gmail.com'];
/* Server */
var articleUrl="http://goldmantimes.com/article/";
/* Local */
/*var articleUrl="http://localhost:8081/article/";*/

router.get('/', function (req, res, next) {
	body=[];
	var page=1;
	if (req.query.p!=null) {
		page=req.query.p;
	}
	if (req.session["tokens"]!=null) {
   		oauth2Client.setCredentials(req.session["tokens"]);
	    var p = new Promise(function (resolve, reject) {
	        plus.people.get({ userId: 'me', auth: oauth2Client }, function(err, response) {
	            resolve(response || err);
	        });
	    }).then(function (session) {
			getIndex(page, function(data){
				res.render("index", {
					content: content,
					pagination: {
					  page: page,
					  pageCount: dataCount-1,
					  postNumber:postperpage
					},
					oauthUrl:oauthUrl,
					email:session.data.emails[0].value,
					owner:owner,
				});
			});
	    });
	}
	else{
		getIndex(page, function(data){
			res.render("index", {
				content: content,
				pagination: {
				  page: page,
				  pageCount: dataCount-1,
				  postNumber:postperpage
				},
				oauthUrl:oauthUrl,
				email:"",
				owner:owner,
			});
		});
	}
});
function getIndex(page, cb){
	content=[];
	var date;
	var filenames=fs.readdirSync(path.join(__dirname,"/../views/articles/"), 'utf-8');
	dataCount=filenames.length;
	i = (page*postperpage)-postperpage;
	while(i < page*postperpage && filenames[i]!=null){
		if (filenames[i]!=null) {
			var filename=null;
			filename=filenames[i];
			var fileread=fs.readFileSync(path.join(__dirname,"/../views/articles/",filename) , 'utf-8');
			var stats=fs.statSync(path.join(__dirname,"/../views/articles/",filename));
			var url=filename.replace(".handlebars", "");
			date=stats.birthtime.toString();
			date=date.substring(4,15);
		    var bodyContent=fileread.substring(fileread.indexOf('<div id="contents">'), fileread.indexOf('<div id="footer">'));
		    var titleContent=fileread.substring(fileread.indexOf("<div id='titleContent'>")+23, fileread.indexOf("</div id='titleContent'>"));
		    var imageContent=fileread.substring(fileread.indexOf("<div id='imageContent'>")+23, fileread.indexOf("</div id='imageContent'>"));
		    var descContent=fileread.substring(fileread.indexOf("<div id='descContent'>")+22, fileread.indexOf("</div id='descContent'>"));
			content.push({
				body:bodyContent,
				filename:filename,
				url:url, 
				date:date, 
				truedate:stats.birthtime.toString(), 
				titleContent:titleContent,
				descContent:descContent,
				imageContent:imageContent
			});
			if(i>=page*postperpage-1){
				cb(content);
			}
		}
		else{
			cb(content);
		}
		i++;
	}
	cb(content);
}

router.use(bodyParser.urlencoded({ extended : true }));
router.post('/delete', (req, response) => {
	var filename = req.body.filename;
	fs.unlinkSync(path.join(__dirname,"/../views/articles",filename));
	response.json({ ok: true });
})
router.post('/save', (req, response) => {
	// you have address available in req.body:
	var url = req.body.link;
	var count;
	https.get(url, res => {
		res.setEncoding("utf8");
		let body = "";
		res.on("data", data => {
			body += data;
		});
		res.on("end", function () {
			save(body).then(function(data){
				fs.writeFileSync(path.join(__dirname,"/../views/articles",data.filename+".handlebars"), data.bodyContent);
				response.json({ ok: true });
			});

			/*var data=fs.readFileSync(path.join(__dirname,"/../views","count.txt"), 'utf8');
			count=Number(util.format(data));
			fs.writeFileSync(path.join(__dirname,"/../views/articles","article_"+count+".handlebars"), body);
			count++;
			fs.writeFileSync(path.join(__dirname,"/../views","count.txt"), count, 'utf8');
			response.json({ ok: true });*/
		});
	});
  // always send a response:
	/*getIndex(response);*/
});

function save(body){
	return new Promise(function(resolve,reject){
		try{
			/* start */
		    var bodyContent=body.substring(body.indexOf('<div id="contents">'), body.indexOf('<div id="footer">'));
		    var titleContent=bodyContent.substring(bodyContent.indexOf('<span'), bodyContent.indexOf('/span>'));
		    bodyContent=bodyContent.replace(titleContent+"/span>","");
		    titleContent=titleContent.substring(titleContent.indexOf('>')+1, titleContent.indexOf('<',titleContent.indexOf('<')+1));
		    var imageContent=bodyContent.substring(bodyContent.indexOf('<img'), bodyContent.indexOf('>', bodyContent.indexOf('<img')));
		    imageContent=imageContent.substring(imageContent.indexOf('src="')+5,imageContent.indexOf('" style='));
		    console.log(imageContent);
		    var descContent=bodyContent.substring(bodyContent.indexOf('<p', bodyContent.indexOf('<p')+1), bodyContent.indexOf('</p>', bodyContent.indexOf('</p>')+1));
		    bodyContent=bodyContent+"<div id='titleContent'>"+titleContent+"</div id='titleContent'>"+"<div id='imageContent'>"+imageContent+"</div id='imageContent'>"+"<div id='descContent'>"+descContent+"</div id='descContent'>";
		    var filename=titleContent.substring(0,50);
		    var i=0;
		    while(fs.existsSync(path.join(__dirname,"/../views/articles",filename+".handlebars"))){
		    	filename=filename+i;
		    	i++;
		    }
			/* end */
			resolve({bodyContent,filename});
		}
		catch(err){
			console.log(err);
			reject(err);
		}
	});
}

router.post('/edit', (req, response) => {
	// you have address available in req.body:
	var url = req.body.link;
	var filename=req.body.filename;
	var count;
	https.get(url, res => {
		res.setEncoding("utf8");
		let body = "";
		res.on("data", data => {
			body += data;
		});
		res.on("end", function () {
			fs.writeFile(path.join(__dirname,"/../views/articles/",filename), body, function(err) {
			    if(err) {
			        return console.log(err);
			    }
		    });
		});
	});
  // always send a response:
	response.json({ ok: true });
	/*getIndex(response);*/
});

router.get('/article/:filename', function(req,res){
	if (req.session["tokens"]!=null) {
   		oauth2(req.session["tokens"], req.params.filename).then(function (session) {
			getSingleContent(session[1]).then(function(data){
				res.render("index", {
					content: data,
					oauthUrl:oauthUrl,
					email:session[0].data.emails[0].value,
					owner:owner,
					layout:'../layouts/articles'
				});
			});
	    });
	}
	else{
		getSingleContent(req.params.filename).then(function(data){
			res.render("index", {
				content: data,
				oauthUrl:oauthUrl,
				email:"",
				owner:owner,
				layout:'../layouts/articles'
			});
		});
	}
});

function oauth2(tokens, filename){
	var newtokens=tokens;
	var newfilename=filename;
	console.log(filename);
	return new Promise(function (resolve, reject) {
		oauth2Client.setCredentials(tokens);
	    plus.people.get({ userId: 'me', auth: oauth2Client }, function(err, response) {
	        resolve([response,newfilename] || err);
	    });
	})
}

function getSingleContent(filename){
		var newfilename=filename;
	return new Promise(function(resolve,reject) {
		try{
			content={};
			filename=newfilename+".handlebars";
			var fileread=fs.readFileSync(path.join(__dirname,"/../views/articles/",filename), "utf8");
			var stats=fs.statSync(path.join(__dirname,"/../views/articles/",filename));
			var url=filename.replace(".handlebars", "");
			date=stats.birthtime.toString();
			date=date.substring(4,15);
		    var bodyContent=fileread.substring(fileread.indexOf('<div id="contents">'), fileread.indexOf("<div id='titleContent'>"));
		    var titleContent=fileread.substring(fileread.indexOf("<div id='titleContent'>")+23, fileread.indexOf("</div id='titleContent'>"));
		    var imageContent=fileread.substring(fileread.indexOf("<div id='imageContent'>")+23, fileread.indexOf("</div id='imageContent'>"));
		    var descContent=fileread.substring(fileread.indexOf("<div id='descContent'>")+22, fileread.indexOf("</div id='descContent'>"));
		    console.log(bodyContent);
			content={
				body:bodyContent,
				filename:filename,
				url:articleUrl+url, 
				date:date, 
				truedate:stats.birthtime.toString(), 
				titleContent:titleContent,
				descContent:descContent,
				imageContent:imageContent
			};
			resolve(content);
		}
		catch(err){
			reject(err);
		}
	});
}
function removeTags(string){
	while(string.includes("<")){
		var toreplace=string.substring(string.indexOf("<"),string.indexOf(">")+1);
		string=string.replace(toreplace, "");
	}
	return string;
}

module.exports = function(url, oauth, p, se){
	oauthUrl=url;
	oauth2Client=oauth;
	plus=p;
	return router;
};