all: update

.PHONY: update
update:
	npm install
	bower install
	make patch-bower-dependencies

.PHONY: patch-bower-dependencies
patch-bower-dependencies:
	sed -i 's/"lib\/codemirror.css"/"lib\/codemirror.css","keymap\/vim.js"/g' bower_components/codemirror/.bower.json
	sed -i '/"name":/a "main":["build/three.min.js"],' bower_components/threejs/.bower.json

.PHONY: setup
setup:
	sudo npm install -g brunch bower

.PHONY: run
run:
	brunch watch --server

.PHONY: clean
clean:
	rm -rf bower_components node_modules
