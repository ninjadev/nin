.PHONY: all
all:
	yarn install
	NODE_ENV=production node_modules/.bin/webpack -p

.PHONY: run
run:
	node_modules/.bin/webpack --watch

.PHONY: lint
lint:
	node_modules/.bin/eslint app/scripts
