docker rmi sketch-ui
cp ../../package.json .
docker build -t sketch-ui .
rm package.json