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
COPY --link apps/web ./apps/web

# Handle environment files
RUN if [ -f ./apps/web/.env ]; then rm ./apps/web/.env; fi
RUN if [ -f ./apps/web/.env.production ]; then mv ./apps/web/.env.production ./apps/web/.env; fi

# Install dependencies from workspace root
RUN bun install

# Build the application
RUN cd apps/web && bun run build

# Finally, build the production image with minimal footprint
FROM base

# Copy the built application and all dependencies from build stage
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/packages /app/packages
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/web/node_modules /app/apps/web/node_modules
COPY --from=build /app/apps/web/package.json /app/apps/web/package.json
COPY --from=build /app/apps/web/server.ts /app/apps/web/server.ts
COPY --from=build /app/apps/web/dist /app/apps/web/dist

# Set working directory for the web app
WORKDIR /app/apps/web

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD ["bun", "run", "start"]
