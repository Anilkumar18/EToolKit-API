FROM node:12.18

RUN MAJOR_VERSION=$(echo $NODE_VERSION | cut -d '.' -f 1) && \
if [ "$MAJOR_VERSION" = "12" ] ; then \
    echo "deb [trusted=yes] http://archive.debian.org/debian stretch main non-free contrib" > /etc/apt/sources.list && \
    echo 'deb-src [trusted=yes] http://archive.debian.org/debian/ stretch main non-free contrib'  >> /etc/apt/sources.list && \
    echo 'deb [trusted=yes] http://archive.debian.org/debian-security/ stretch/updates main non-free contrib'  >> /etc/apt/sources.list; \
fi

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install

# Install Puppeteer and its dependencies
RUN apt-get update && apt-get install -y \
    libnss3 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libgbm-dev \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*
# If you are building your code for production
#RUN npm ci --only=production
# Bundle app source
COPY . .

RUN npm run build

RUN ls -l

ARG node_env_dev=development
ENV NODE_ENV=$node_env_dev

EXPOSE 4009

CMD [ "node","dist/index.js" ]