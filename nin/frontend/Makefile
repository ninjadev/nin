.PHONY: all
all:
	yarn install
	node_modules/.bin/webpack

.PHONY: run
run:
	node_modules/.bin/webpack --watch

.PHONY: lint
lint:
	node_modules/.bin/eslint app/scripts
