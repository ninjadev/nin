all: update

.PHONY: update
update:
	npm install
	bower install

.PHONY: setup
setup:
	sudo npm install -g brunch bower

.PHONY: run
run:
	brunch watch --server
