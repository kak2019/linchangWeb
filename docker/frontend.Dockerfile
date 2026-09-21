# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_WORKBENCH_URL=
ENV NEXT_PUBLIC_WORKBENCH_URL=${NEXT_PUBLIC_WORKBENCH_URL}

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

COPY . .
ENV DATABASE_URL="mysql://user:pass@127.0.0.1:3306/narrativeos"
RUN npm run build


FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./

EXPOSE 3000

CMD ["sh", "-c", "if [ -n \"$DATABASE_URL\" ]; then npx prisma migrate deploy; fi && npm start"]
