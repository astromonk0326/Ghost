#!/bin/bash

set -e

echo "Updating git submodules..."
git submodule update --init --recursive

echo "Clearing the build cache..."
yarn nx reset --only-cache
yarn nx reset --only-workspace-data

echo "Building typescript packages..."
yarn nx run-many -t build:ts

echo "Building Ghost admin..."
yarn nx run ghost-admin:build