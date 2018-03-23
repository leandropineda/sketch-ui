# base image
FROM node:9.5

# set working directory
RUN mkdir /usr/src/app
WORKDIR /usr/src/app

# add `/usr/src/app/node_modules/.bin` to $PATH
ENV PATH /usr/src/app/node_modules/.bin:$PATH

# install and cache app dependencies
ADD package.json /usr/src/app/package.json
#RUN npm install --no-optional
RUN npm install --silent
#RUN npm install ajv
#RUN npm install --save react@^15.3.0 react-dom@^15.3.0
RUN npm install react-scripts@1.1.1 -g --save
#RUN npm install react-addons-update --save
RUN npm install cors
RUN npm install react-vis --save
#RUN npm install react-table
#RUN npm install prop-types --save
RUN npm install react-bootstrap-table-next --save

# start app
CMD ["npm", "start"]

