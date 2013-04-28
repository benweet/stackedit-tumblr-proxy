var url   = require('url'),
    http  = require('http'),
    https = require('https'),
	oauth = require('oauth').OAuth,
	tumblr = require('tumblr.js'),
    fs    = require('fs'),
    express = require('express'),
    qs    = require('querystring');

// Load config defaults from JSON file.
// Environment variables override defaults.
function loadConfig() {
  var config = JSON.parse(fs.readFileSync(__dirname+ '/config.json', 'utf-8'));
  for (var i in config) {
    config[i] = process.env[i.toUpperCase()] || config[i];
  }
  console.log('Configuration');
  console.log(config);
  return config;
}

var config = loadConfig();
var app = express();
app.use(express.bodyParser());

// Convenience for allowing CORS on routes - GET only
app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*'); 
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS'); 
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

function createOauthObject() {
	return new oauth(
		config.oauth_request_token_url,
		config.oauth_access_token_url,
		config.oauth_consumer_key,
		config.oauth_consumer_secret,
		"1.0",
		"http://localhost/cb",
		"HMAC-SHA1");
}

app.get('/request_token', function(req, res) {
	console.log("/request_token");
	var oa = createOauthObject();
	oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
		if(error) {
			console.log("Error: " + error);
			res.json({error: error});
			return;
		}
		console.log("OAuth token: " + oauth_token);
		console.log("OAuth token secret: " + oauth_token_secret);
		// Send OAuth token back to the client
		res.json({oauth_token: oauth_token, oauth_token_secret: oauth_token_secret});
	});
});

app.get('/access_token', function(req, res) {
	console.log("/access_token");
	var oa = createOauthObject();
	oa.getOAuthAccessToken(
		req.param('oauth_token'), 
		req.param('oauth_token_secret'), 
		req.param('oauth_verifier'), 
		function(error, oauth_access_token, oauth_access_token_secret, results) {
			if(error) {
				console.log("Error: " + error);
				res.json({error: error});
				return;
			}
			console.log("Access token: " + oauth_access_token);
			console.log("Access token secret: " + oauth_access_token_secret);
			// Send access token back to the client
			res.json({access_token: oauth_access_token, access_token_secret: oauth_access_token_secret});
		}
	);
});

app.post('/post', function(req, res) {
	console.log("/post");
	var client = tumblr.createClient({
		  consumer_key: config.oauth_consumer_key,
		  consumer_secret: config.oauth_consumer_secret,
		  token: req.body.access_token,
		  token_secret: req.body.access_token_secret
	});
	function handleError(err) {
		try {
			var parsedError = /API error: (\d+)\s(.+)/g.exec(err.message);
			var errorCode = parseInt(parsedError[1], 10);
			var errorMsg = parsedError[2];
			console.log("Error code: " + errorCode);
			console.log("Error message: " + errorMsg);
			res.send(errorMsg, errorCode);
		}
		catch(e) {
			console.log("Error: " + err.message);
			res.send(err.message, 500);
		}
	}
	// Validate the hostname
	client.userInfo(function(err, data) {
		if(err) {
			handleError(err);
			return;
		}
		var authorized = false;
		for(var i=0; i<data.user.blogs.length; i++) {
			var blog = data.user.blogs[i];
			
			if(blog.name == req.body.blog_hostname || blog.url == "http://" + req.body.blog_hostname + "/") {
				authorized = true;
				break;
			} 
		}
		if(authorized === false) {
			res.send("Blog hostname is not allowed", 500);
			return;
		}
		var options = {};
		options.title = req.body.title;
		options.body = req.body.content;
		if(req.body.format) {
			options.format = req.body.format;
		}
		if(req.body.tags) {
			options.tag = req.body.tags;
		}
		function callback(err, data) {
			if(err) {
				handleError(err);
				return;
			}
			console.log("Post ID: " + data.id);
			res.json(data);
		}
		if(req.body.post_id) {
			options.id = req.body.post_id;
			client.edit(req.body.blog_hostname, options, callback);
		}
		else {
			client.text(req.body.blog_hostname, options, callback);
		}
	});
});

var port = process.env.PORT || config.port || 9999;

app.listen(port, null, function (err) {
	console.log('Server started: http://localhost:' + port);
});
