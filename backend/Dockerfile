# GymTracker backend image: Go REST API + internal gRPC analytics service.
# Build context is this backend/ directory: docker build -t gymtracker-api backend

FROM golang:1.25-alpine AS build
WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/gymtracker-api . \
 && CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/analytics-service ./services/analytics-service

FROM alpine:3.22
# CA certificates for TLS to hosted PostgreSQL and the Gemini API
RUN apk add --no-cache ca-certificates \
 && adduser -D -H -u 10001 app

WORKDIR /app
COPY --from=build /out/ /app/
COPY docker-entrypoint.sh /app/docker-entrypoint.sh

USER app
# Render injects PORT at runtime; 10000 is Render's default and this image's fallback
ENV PORT=10000
EXPOSE 10000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
