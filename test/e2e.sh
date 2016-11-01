echo "Testing dont-break"

npm link
echo "Linked current dont-break to global"

echo "Creating test folder"
folder=/tmp/test-dont-break
rm -rf $folder
mkdir $folder
cd $folder
echo "Created test folder $folder"

echo "Cloning boggle"
git clone https://github.com/bahmutov/boggle.git
cd boggle
npm install
npm test
echo "Boggle is working"

git log --oneline -n 5
dont-break

