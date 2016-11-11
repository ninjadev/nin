.PHONY: all
all:
	yarn install

.PHONY: run
run:
	./nin

.PHONY: bundle-deps
bundle-deps:
	cd ../frontend && make
	cp -r ../frontend/dist frontend/
	cp -r ../dasBoot/ dasBoot/

.PHONY: publish
publish:
	npm run npm_prepublish
	npm publish
	npm run npm_postpublish
