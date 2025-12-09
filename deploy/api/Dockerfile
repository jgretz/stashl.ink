# Adjust BUN_VERSION as desired
ARG BUN_VERSION=1.3.2
FROM oven/bun:${BUN_VERSION}-slim AS base

LABEL fly_launch_runtime="Bun"

# Set production environment
WORKDIR /app
ENV NODE_ENV="production"

# Install packages needed to build the package
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential pkg-config python-is-python3

FROM base AS build

# Copy workspace files first
COPY --link package.json tsconfig.json ./
COPY --link packages ./packages
COPY --link apps/api ./apps/api

# Handle environment files
RUN if [ -f ./apps/api/.env ]; then rm ./apps/api/.env; fi
RUN if [ -f ./apps/api/.env.production ]; then mv ./apps/api/.env.production ./apps/api/.env; fi

# Install dependencies from workspace root
RUN bun install

# Finally, build the production image with minimal footprint
FROM base

# Copy the entire workspace structure to preserve package imports
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/packages /app/packages
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/api/node_modules /app/apps/api/node_modules
COPY --from=build /app/apps/api/package.json /app/apps/api/package.json
COPY --from=build /app/apps/api/src /app/apps/api/src

# Set working directory for the API app
WORKDIR /app/apps/api

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
