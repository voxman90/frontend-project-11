install:
		npm ci

lint:
		npx eslint .

publish:
		npm publish --dry-run && sudo npm link

start:
		clear & npm start
