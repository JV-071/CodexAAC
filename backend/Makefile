.PHONY: run build test clean prisma-generate prisma-migrate prisma-studio

# Run the server
run:
	go run cmd/server/main.go

# Build the project
build:
	go build -o bin/server cmd/server/main.go

# Run tests
test:
	go test ./...

# Clean compiled files
clean:
	rm -rf bin/

# Generate Prisma client
prisma-generate:
	cd prisma && prisma generate

# Create new migration
prisma-migrate:
	cd prisma && prisma migrate dev --name init

# Open Prisma Studio
prisma-studio:
	cd prisma && prisma studio

