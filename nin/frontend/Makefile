.PHONY: all
all:
	yarn install
	webpack

.PHONY: run
run:
	webpack --watch

.PHONY: lint
lint:
	node_modules/.bin/eslint app/scripts
