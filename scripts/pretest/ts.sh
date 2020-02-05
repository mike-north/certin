#!/bin/bash
yarn build:ts && yarn rimraf tests_js && yarn tsc -p tests