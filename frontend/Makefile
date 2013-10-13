all: update

.PHONY: update
update:
	npm install
	make ghetto-bower

.PHONY: ghetto-bower
ghetto-bower:
	mkdir -p vendor/ghetto-bower
	cat ghetto-bower.txt | sed "s/^/wget /" | sed "s/-O /-O vendor\/ghetto-bower\//" | sh

.PHONY: setup
setup:
	sudo npm install -g brunch bower

.PHONY: run
run:
	brunch watch --server

.PHONY: clean
clean:
	rm -rf node_modules vendor/ghetto-bower
