all: update

.PHONY: update
update:
	npm install
	bower install
	cat bower_components/codemirror/.bower.json | sed 's/"lib\/codemirror.css"/"lib\/codemirror.css","keymap\/vim.js"/g' | tee bower_components/codemirror/.bower.json
	sed -i '/"name":/a "main":["build/three.min.js"],' bower_components/threejs/.bower.json


.PHONY: setup
setup:
	sudo npm install -g brunch bower

.PHONY: run
run:
	brunch watch --server
