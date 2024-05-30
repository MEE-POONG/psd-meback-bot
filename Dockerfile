FROM node:16

# Install Google Chrome Stable and fonts
# Note: this installs the necessary libs to make the browser work with Puppeteer.
RUN apt-get update && apt-get install gnupg wget -y && \
    wget --quiet --output-document=- https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-archive.gpg && \
    sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
    apt-get update && \
    apt-get install google-chrome-stable -y --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app



ENV DATABASE_URL="mongodb+srv://chunwarayut:05r31M9wnI4dE87L@db-mongodb-sgp-bb56ac46.mongo.ondigitalocean.com/psdbotdb"

RUN echo "DATABASE_URL=$DATABASE_URL"
RUN echo "DATABASE_URL=$DATABASE_URL" >> .env




COPY package.json ./
RUN yarn install
COPY . .

CMD ["yarn", "start:consumer"]
