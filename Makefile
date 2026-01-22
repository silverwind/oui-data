node_modules: package-lock.json
	npm install --no-save
	@touch node_modules

.PHONY: deps
deps: node_modules

.PHONY: lint
lint: node_modules
	npx eslint --ext js,jsx,ts,tsx --color .
	npx tsc

.PHONY: lint-fix
lint-fix: node_modules
	npx eslint --ext js,jsx,ts,tsx --color . --fix
	npx tsc

.PHONY: test
test: node_modules lint
	npx vitest

update: node_modules
	npx updates -cu
	rm -rf node_modules package-lock.json
	npm install
	@touch node_modules

.PHONY: update-data
update-data: node_modules
	node update-data.ts

.PHONY: publish
publish: node_modules
	npm publish

.PHONY: patch
patch: node_modules lint test
	npx versions patch package.json package-lock.json
	git push -u --tags origin master

.PHONY: minor
minor: node_modules lint test
	npx versions minor package.json package-lock.json
	git push -u --tags origin master

.PHONY: major
major: node_modules lint test
	npx versions major package.json package-lock.json
	git push -u --tags origin master
