.PHONY: all
all:
	npm start

.PHONY: publish
publish: all
	npm version major
	npm publish
