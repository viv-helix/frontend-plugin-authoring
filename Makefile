intl_imports = ./node_modules/.bin/intl-imports.js
transifex_utils = ./node_modules/.bin/transifex-utils.js
i18n = ./src/i18n
transifex_input = $(i18n)/transifex_input.json

# This directory must match .babelrc .
transifex_temp = ./temp/babel-plugin-formatjs

build:
	rm -rf ./dist
	./node_modules/.bin/fedx-scripts babel src --out-dir dist --source-maps --extensions '.js,.jsx,.ts,.tsx' --ignore '**/*.test.jsx,**/*.test.js,**/*.test.tsx,**/*.test.ts,**/setupTest.js' --copy-files
	@# --copy-files brings in everything else (scss, etc.). Remove test/snapshot artifacts.
	@find dist -name '*.test.js*' -delete
	@rm -rf dist/**/__snapshots__

precommit:
	npm run lint
	npm audit

requirements:
	npm ci

i18n.extract:
	# Pulling display strings from source files into .json files...
	rm -rf $(transifex_temp)
	npm run-script i18n_extract

i18n.concat:
	# Gathering JSON messages into one file...
	$(transifex_utils) $(transifex_temp) $(transifex_input)

extract_translations: | requirements i18n.extract i18n.concat
