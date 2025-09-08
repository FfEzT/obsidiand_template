folder=$(dirname $0)
cd $folder

cd ..
git status
echo "------------------add+status"

echo waiting...
read
git log --oneline --graph --decorate
