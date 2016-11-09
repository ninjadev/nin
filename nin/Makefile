.PHONY: all
all:
	cd backend && make
	cd frontend && make

.PHONY: link-nin
link-nin:
	sudo ln -s "$$(pwd)/backend/nin" /usr/bin/nin
