StackEdit Tumblr Proxy
======================

Tumblr proxy for StackEdit. Supports Tumblr API v2.

**Usage:**

	npm install
	node server.js


Deploy on Heroku
----------------

 - Create the application:

		heroku create

 - Rename the application:

		heroku apps:rename stackedit-tumblr-proxy

 - Specify application's consumer key / secret key:

		heroku config:add OAUTH_CONSUMER_KEY=abc OAUTH_CONSUMER_SECRET=xyz OAUTH_REDIRECT_URL=http://localhost/html/tumblr-oauth-client.html

 - Push changes to Heroku:

		git push heroku master