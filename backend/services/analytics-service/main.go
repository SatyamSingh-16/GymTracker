package main

import (
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	analyticspb "gymtracker-backend/proto/analytics"
	"gymtracker-backend/services/analytics-service/service"

	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

func main() {
	port := os.Getenv("GRPC_PORT")
	if port == "" {
		port = "50051"
	}

	// 1. Listen on TCP network address
	lis, err := net.Listen("tcp", ":"+port)
	if err != nil {
		log.Fatalf("❌ Failed to listen on gRPC port %s: %v", port, err)
	}

	// 2. Create gRPC Server instance
	grpcServer := grpc.NewServer()

	// 3. Register our AnalyticsServer implementation
	analyticsService := service.NewAnalyticsServer()
	analyticspb.RegisterAnalyticsServiceServer(grpcServer, analyticsService)

	// 4. Register gRPC Reflection (allows tools like Postman / Evans CLI to inspect the API)
	reflection.Register(grpcServer)

	// 5. Graceful shutdown handler
	go func() {
		stopChan := make(chan os.Signal, 1)
		signal.Notify(stopChan, os.Interrupt, syscall.SIGTERM)
		<-stopChan
		log.Println("🛑 Shutting down gRPC Analytics Microservice gracefully...")
		grpcServer.GracefulStop()
	}()

	log.Printf("🚀 gRPC Analytics Microservice running on port :%s", port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("❌ gRPC server failed to serve: %v", err)
	}
}
