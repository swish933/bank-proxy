# syntax = docker/dockerfile:1

ARG NODE_VERSION=22.21.1
FROM node:${NODE_VERSION}-slim AS base

LABEL fly_launch_runtime="Node.js"

WORKDIR /app

ENV NODE_ENV="production"


FROM base AS build

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3

COPY package-lock.json package.json ./
RUN npm ci

COPY . .


FROM base

# Install Chrome in the final image
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    google-chrome-stable \
    fonts-freefont-ttf \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app /app

EXPOSE 3000
CMD [ "npm", "run", "start" ]