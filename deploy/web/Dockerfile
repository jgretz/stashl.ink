# Adjust BUN_VERSION as desired
ARG BUN_VERSION=1.3.2
FROM oven/bun:${BUN_VERSION}-slim AS base

LABEL fly_launch_runtime="Bun"

# Set production environment
WORKDIR /app
ENV NODE_ENV="production"

FROM base AS build

# Install packages needed to build the package
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential pkg-config python-is-python3

# Copy Files
COPY --link package.json tsconfig.json ./
COPY --link packages ./packages
COPY --link apps/web ./apps/web

RUN rm ./apps/web/.env
RUN mv ./apps/web/.env.production ./apps/web/.env

# Install dependencies
RUN bun install --ci
RUN cd apps/web && bun install --ci

# build
RUN cd apps/web && bun run build

# Finally, build the production image with minimal footprint
FROM base

COPY --from=build /app/apps/web/.output /app/.output

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD ["bun", "run", "-r", "dotenv/config", ".output/server/index.mjs"]
