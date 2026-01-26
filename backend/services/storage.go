package services

import (
	"context"
	"log"
	"os"

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

	// Initialize minio client object.
	var err error
	MinioClient, err = minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		log.Fatalln(err)
	}

	// Make a new bucket called mymusic.
	ctx := context.Background()
	err = MinioClient.MakeBucket(ctx, BucketName, minio.MakeBucketOptions{})
	if err != nil {
		// Check to see if we already own this bucket (which happens if it exists)
		exists, errBucketExists := MinioClient.BucketExists(ctx, BucketName)
		if errBucketExists == nil && exists {
			log.Printf("We already own %s\n", BucketName)
		} else {
			log.Fatalln(err)
		}
	} else {
		log.Printf("Successfully created %s\n", BucketName)
	}
}

// UploadFile uploads a file to MinIO and returns the URL
// Note: In production, might want to use Presigned URLs or proxy stream.
// For now, simple upload from server side (after receiving from client).
func UploadFile(ctx context.Context, objectName string, filePath string, contentType string) (string, error) {
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
