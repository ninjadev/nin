.PHONY: all
all:
	yarn install
	cd frontend && make

.PHONY: publish
publish: all
	npm publish
