#!/usr/bin/env bash

# build module
npm run build

# build for browser
./node_modules/.bin/browserify  -o dist/bundle.js --standalone Pflow dist/metamodel.js
