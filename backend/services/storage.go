package services

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

var MinioClient *minio.Client
var BucketName string

func InitMinio() {
	endpoint := os.Getenv("MINIO_ENDPOINT")
	accessKeyID := os.Getenv("MINIO_ACCESS_KEY")
	secretAccessKey := os.Getenv("MINIO_SECRET_KEY")
	useSSL := os.Getenv("MINIO_USE_SSL") == "true"
	BucketName = os.Getenv("MINIO_BUCKET")

	if endpoint == "" {
		log.Println("Warning: MINIO_ENDPOINT is not set. MinIO storage will be disabled.")
		MinioClient = nil
		return
	}

	// Initialize minio client object.
	var err error
	MinioClient, err = minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		log.Printf("Warning: Failed to initialize MinIO client: %v. MinIO storage will be disabled.\n", err)
		MinioClient = nil
		return
	}

	// Check or create bucket with generous timeout for remote SSL handshake
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	exists, errBucketExists := MinioClient.BucketExists(ctx, BucketName)
	if errBucketExists == nil && exists {
		log.Printf("MinIO: Bucket '%s' is ready and accessible.\n", BucketName)
		return
	}

	err = MinioClient.MakeBucket(ctx, BucketName, minio.MakeBucketOptions{})
	if err != nil {
		// Verify if it failed because bucket already exists
		exists, errCheck := MinioClient.BucketExists(ctx, BucketName)
		if errCheck == nil && exists {
			log.Printf("MinIO: We already own bucket '%s'\n", BucketName)
			return
		}
		log.Printf("Warning: MinIO connection/bucket check failed: %v. MinIO storage will be disabled, but server will continue running.\n", err)
		MinioClient = nil
		return
	}
	log.Printf("MinIO: Successfully created bucket '%s'\n", BucketName)
}

// UploadFile uploads a file to MinIO and returns the URL
// Note: In production, might want to use Presigned URLs or proxy stream.
// For now, simple upload from server side (after receiving from client).
func UploadFile(ctx context.Context, objectName string, filePath string, contentType string) (string, error) {
	if MinioClient == nil {
		return "", fmt.Errorf("storage service (MinIO) is currently unavailable or disabled")
	}

	// Upload the file with FPutObject
	info, err := MinioClient.FPutObject(ctx, BucketName, objectName, filePath, minio.PutObjectOptions{ContentType: contentType})
	if err != nil {
		return "", err
	}

	log.Printf("Successfully uploaded %s of size %d\n", objectName, info.Size)

	// Return URL (assuming public or we construct it)
	// If MinIO is local, we might need to return a path relative to the domain.
	protocol := "http"
	if os.Getenv("MINIO_USE_SSL") == "true" {
		protocol = "https"
	}
	// Construct public URL
	// Note: This often depends on how MinIO is exposed (e.g. via Nginx or direct).
	url := protocol + "://" + os.Getenv("MINIO_ENDPOINT") + "/" + BucketName + "/" + objectName
	return url, nil
}
