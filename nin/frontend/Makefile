.PHONY: all
all:
	yarn install
	node_modules/.bin/webpack -p

.PHONY: run
run:
	node_modules/.bin/webpack --watch --display-error-details

.PHONY: lint
lint:
	node_modules/.bin/eslint app/scripts
