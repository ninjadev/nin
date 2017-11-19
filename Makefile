.PHONY: all
all:
	yarn start

.PHONY: publish
publish: all
	npm version major
	npm publish
