StackEdit Tumblr proxy
======================

Tumblr proxy for StackEdit. Supports Tumblr API v2.

Deploy on Heroku
----------------

 - Create the application:

		heroku create

 - Rename the application:

		heroku apps:rename stackedit-tumblr-proxy

 - Specify application's consumer key / secret key:

		heroku config:add OAUTH_CONSUMER_KEY=abc OAUTH_CONSUMER_SECRET=xyz

 - Push changes to Heroku:

		git push heroku master