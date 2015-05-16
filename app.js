var express = require('express'),
app = express(),
methodOverride = require('method-override'),
bodyParser = require('body-parser');
var https = require('https');
var crunchbase = require('crunchbase2');

//middleware
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));

//for static js and css files
app.use(express.static(__dirname + '/public'));

//Crunchbase API section

var CompanyObj = function(name){
    this.coName = name;
    this.coAlias ='';
    this.coDescr = '';
    this.coFoundedOn = '';
    this.coLogoUrl = '';
    this.empNo = '';
    this.coHQCity = '';
    this.forProfit = '';
    this.focusAreas = [];
    this.coWebsite = '';
    this.coCBSite = '';
    this.competitors = [];
    this.coNews = {headline:[], url:[], author:[], postDate:[]};
  };


var cbKey = process.env.CBKEY;
crunchbase.init(cbKey);
console.log(cbKey);
// console.log(https.request);

//Routes
app.get('/', function(req,res){
	res.render('index');
});

app.get('/search/:firm', function(req,res){
	console.log("starting!!!");
	var company = req.params.firm; 
	var collection = [];

	var options = {
		host: 'api.crunchbase.com',
		port: 443,
		path: "/v/2/organizations?&user_key="+cbKey+"&name=" + company,
		method: 'GET'
	};
	// console.log("about to start");
	var reqGet = https.request(options, function(rep){
		var resp = '';
		rep.on('data', function(d){
			resp += d;
		});

		rep.on('end', function(){
			var items = JSON.parse(resp).data.items;
			for(var i=0; i < items.length; i++){
				collection.push(items[i].name);
			}

			res.send({list: collection});
		});
	});
	reqGet.end();
	reqGet.on('error', function(e){console.log('ERROR!!! ' + e);});
});

app.get('/show/:company', function(req,res){
	var selCompany = req.params.company,
	errmsg = 0,
	output;

	console.log(selCompany);
	var options = {
		host: 'api.crunchbase.com',
		port: 443,
		path: "/v/2/organization/" + selCompany + "?&user_key="+ cbKey,
		method: 'GET'
	};
	var reqGet = https.request(options, function(rep){
		var resp = '';
		rep.on('data', function(d){
			resp += d;
		});

		rep.on('end', function(){
			if(!resp){res.send("1"); return;}
			var detail = JSON.parse(resp);
			var props = detail.data.properties;
	    var currentCo = new CompanyObj(props.name);
	    var cats = detail.data.relationships.categories.items;
	    var news = detail.data.relationships.news.items;

	    console.log("Company Object: " + currentCo);

	    	// converting to my object
    currentCo.coAlias =  props.also_known_as || "";
    currentCo.coDescr = props.description;
    currentCo.coFoundedOn = props.founded_on;
    currentCo.empNo = props.number_of_employees;
    currentCo.coHQCity = detail.data.relationships.headquarters.items[0].city + detail.data.relationships.headquarters.items[0].region;
    currentCo.forProfit = props.secondary_role_for_profit;
    currentCo.focusAreas = cats.map(function(val){return val.name;});
    currentCo.coWebsite = props.homepage_url;
    currentCo.coCBSite = 'https://www.crunchbase.com/organization/' + currentCo.coName;
    currentCo.coLogoUrl = currentCo.coCBSite +detail.data.relationships.primary_image.items[0].path;
    currentCo.coNews.headline = news.map(function(val){return val.title;});
    currentCo.coNews.url = news.map(function(val){return val.url;});
    currentCo.coNews.author = news.map(function(val){return val.author;});
    currentCo.coNews.postDate = news.map(function(val){return val.posted_on;});

    output = currentCo? currentCo : 1;
    res.send(JSON.stringify(output));

		});
	});
	reqGet.end();
	reqGet.on('error', function(e){console.log(e);});

	// crunchbase.organization({query: selCompany}, function(err, detail){
 //    if(err){
 //      errmsg = 1;
 //      return errmsg;
 //    }
 //    console.log(detail);

 //    var props = detail.data.properties;
 //    var currentCo = new CompanyObj(props.name);
 //    var cats = detail.data.relationships.categories.items;
 //    var news = detail.data.relationships.news.items;

 //    	// converting to my object
 //    currentCo.coAlias =  props.also_known_as || "";
 //    currentCo.coDescr = props.description;
 //    currentCo.coFoundedOn = props.founded_on;
 //    currentCo.empNo = props.number_of_employees;
 //    currentCo.coHQCity = detail.data.relationships.headquarters.items[0].city + detail.data.relationships.headquarters.items[0].region;
 //    currentCo.forProfit = props.secondary_role_for_profit;
 //    currentCo.focusAreas = cats.map(function(val){return val.name;});
 //    currentCo.coWebsite = props.homepage_url;
 //    currentCo.coCBSite = 'https://www.crunchbase.com/organization/' + currentCo.coName;
 //    currentCo.coLogoUrl = currentCo.coCBSite +detail.data.relationships.primary_image.items[0].path;
 //    currentCo.coNews.headline = news.map(function(val){return val.title;});
 //    currentCo.coNews.url = news.map(function(val){return val.url;});
 //    currentCo.coNews.author = news.map(function(val){return val.author;});
 //    currentCo.coNews.postDate = news.map(function(val){return val.posted_on;});

 //    output = errmsg === 0? currentCo : errmsg;
 //    res.send(JSON.stringify(output));
 //  });
});


//starting server
app.listen(3001, function(){
	console.log('Server has started!!! at port 3001');
});

	


