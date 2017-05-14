check:
	@node libs/check.js

start:
	@node app.js

schedule:
	@node ./node_modules/.bin/pm2 start schedule.js --name "GitBook-CDN-plan"

.PHONY: check start schedule
