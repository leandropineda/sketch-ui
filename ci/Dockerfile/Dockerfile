# base image
FROM node:9.5

# set working directory
RUN mkdir /usr/src/app
WORKDIR /usr/src/app

# add `/usr/src/app/node_modules/.bin` to $PATH
ENV PATH /usr/src/app/node_modules/.bin:$PATH

# install and cache app dependencies
ADD package.json /usr/src/app/package.json
RUN npm install
RUN npm install react-scripts@1.1.1 -g
RUN npm install cors
RUN npm install react-vis --save
RUN npm install --save react-showcase

# start app
CMD ["npm", "start"]

