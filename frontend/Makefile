all: update

.PHONY: update
update:
	npm install
	bower install
	make .patch-bower-dependencies
	make external-dependencies

.patch-bower-dependencies:
	sed -i 's/"lib\/codemirror.css"/"lib\/codemirror.css","keymap\/vim.js"/g' bower_components/codemirror/.bower.json
	sed -i '/"name":/a "main":["build/three.min.js"],' bower_components/threejs/.bower.json
	touch .patch-bower-dependencies

.PHONY: external-dependencies
external-dependencies:
	mkdir -p vendor/external-dependencies
	wget http://waveformjs.org/waveform.js -O vendor/external-dependencies/waveform.js

.PHONY: setup
setup:
	sudo npm install -g brunch bower

.PHONY: run
run:
	brunch watch --server

.PHONY: clean
clean:
	rm -rf bower_components node_modules .patch-bower-dependencies vendor/external-dependencies
