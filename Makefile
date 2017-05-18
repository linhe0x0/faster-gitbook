check:
	@node libs/check.js

start:
	@node app.js

schedule:
	@node ./node_modules/.bin/pm2 start schedule.js --name "GitBook-CDN-plan"

deploy:
	@git config user.username 'travis'
	@git config user.email 'travis.org@fetalk.xyz'
	@git remote add fetalk git@fetalk.xyz:GitBook-CDN-plan
	@git push fetalk master

generate:
	@node generator.js

.PHONY: check start schedule deploy generate
