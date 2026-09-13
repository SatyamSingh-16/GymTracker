package grpcclient

import (
	"context"
	"fmt"
	"os"
	"sync"
	"time"

	analyticspb "gymtracker-backend/proto/analytics"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

var (
	clientInstance analyticspb.AnalyticsServiceClient
	clientConn     *grpc.ClientConn
	clientOnce     sync.Once
	initErr        error
)

// GetAnalyticsClient initializes or returns the singleton gRPC client connection
func GetAnalyticsClient() (analyticspb.AnalyticsServiceClient, error) {
	clientOnce.Do(func() {
		addr := os.Getenv("ANALYTICS_GRPC_ADDR")
		if addr == "" {
			addr = "127.0.0.1:50051"
		}

		// Connect using insecure credentials for local internal communication
		conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
		if err != nil {
			initErr = fmt.Errorf("failed to connect to analytics gRPC service at %s: %w", addr, err)
			return
		}

		clientConn = conn
		clientInstance = analyticspb.NewAnalyticsServiceClient(conn)
	})

	if initErr != nil {
		return nil, initErr
	}
	return clientInstance, nil
}

// Calculate1RM calls the gRPC microservice with a 5-second timeout
func Calculate1RM(weightKg float64, reps int) (*analyticspb.OneRMResponse, error) {
	client, err := GetAnalyticsClient()
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return client.Calculate1RM(ctx, &analyticspb.OneRMRequest{
		WeightKg: weightKg,
		Reps:     int32(reps),
	})
}
