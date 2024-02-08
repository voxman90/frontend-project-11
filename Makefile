install:
		npm ci

lint:
		npx eslint .

publish:
		npm publish --dry-run && sudo npm link

start:
		npm start
