# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
# bun >= 1.2 required: repo lockfile is bun.lock (text format), not bun.lockb
FROM oven/bun:1.3.14 AS base
WORKDIR /usr/src/app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

ENV NODE_ENV=production
RUN bun x tsc --noEmit

# copy production dependencies and source code into final image
# env vars (.env*) are injected at runtime, never baked into the image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /usr/src/app/package.json .
COPY --from=prerelease /usr/src/app/tsconfig.json .
COPY --from=prerelease /usr/src/app/app ./app
COPY --from=prerelease /usr/src/app/src ./src
COPY --from=prerelease /usr/src/app/common ./common
COPY --from=prerelease /usr/src/app/db ./db
COPY --from=prerelease /usr/src/app/utils ./utils
COPY --from=prerelease /usr/src/app/drizzle.config.ts .

ENV NODE_ENV=production
ENTRYPOINT [ "bun", "start" ]