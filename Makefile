.PHONY: all
all:
	npm start

.PHONY: bump-version
bump-version:
	npm --no-git-tag-version version major
