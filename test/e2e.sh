#!/bin/bash

set -e

echo "Testing dont-break"

npm link
echo "Linked current dont-break to global"

echo "Creating test folder"
folder=/tmp/test-dont-break
rm -rf $folder
mkdir $folder
cd $folder
echo "Created test folder $folder"

echo "Cloning first module"
git clone https://github.com/bahmutov/dont-break-foo.git
cd dont-break-foo
npm install --prod
npm run dont-break
echo "dont-break is working"
