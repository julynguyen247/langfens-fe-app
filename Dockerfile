FROM node:18-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package*.json ./
RUN npm ci
COPY . .
RUN if [ ! -s "src/app/do-test/[skill]/page.tsx" ]; then \
      printf "%s\n" \
        "// auto-generated to satisfy Next.js in Docker build" \
        "export default function Page() { return null; }" \
        > "src/app/do-test/[skill]/page.tsx"; \
    fi
RUN npm run build

FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package*.json ./
RUN npm ci --omit=dev
EXPOSE 3000
CMD ["npm", "start"]
