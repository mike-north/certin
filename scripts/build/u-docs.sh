#!/bin/bash
yarn rimraf '.private-types' && \
    cp -r dist '.private-types' && \
    yarn rimraf 'dist/**/*.d.ts' && \
    yarn api-extractor run --local --verbose && \
    yarn rimraf '.private-types'