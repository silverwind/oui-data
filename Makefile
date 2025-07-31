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

.PHONY: publish
publish: node_modules
	git push -u --tags origin master
	npm publish

update: node_modules
	npx updates -cu
	rm -rf node_modules package-lock.json
	npm install
	@touch node_modules

.PHONY: update-data
update-data: node_modules
	node update-data.ts

.PHONY: patch
patch: node_modules test
	npx versions patch package.json package-lock.json
	@$(MAKE) --no-print-directory publish

.PHONY: minor
minor: node_modules test
	npx versions minor package.json package-lock.json
	@$(MAKE) --no-print-directory publish

.PHONY: major
major: node_modules test
	npx versions major package.json package-lock.json
	@$(MAKE) --no-print-directory publish
