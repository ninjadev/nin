.PHONY: all
all:
	npm start

.PHONY: bump-version-and-tag-commit-for-release
bump-version-and-tag:
	npm version major
