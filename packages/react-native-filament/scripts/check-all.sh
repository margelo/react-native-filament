#!/bin/bash

echo "Formatting C++ code.."
./scripts/clang-format.sh

echo "Linting JS/TS code.."
yarn lint --fix
yarn typescript

echo "All done!"
