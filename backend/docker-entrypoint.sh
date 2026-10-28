#!/bin/sh
set -e

# The 1RM endpoint calls this gRPC service at ANALYTICS_GRPC_ADDR (default 127.0.0.1:50051)
/app/analytics-service &

# exec so the API receives the platform's SIGTERM directly
exec /app/gymtracker-api
