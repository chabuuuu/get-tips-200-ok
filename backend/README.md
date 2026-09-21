# GET TIPS 200 OK - Backend (Go + Fiber)

Backend API service for the "GET TIPS 200 OK" blog.

## 🚀 Running the Server

```bash
# 1. Start Docker containers (PostgreSQL & MinIO) if running locally
docker-compose up -d

# 2. Run Go server
go run main.go
```

The API runs by default on `http://localhost:8080/api`.

---

## 🛠️ Utility & Migration Scripts

The `./cmd` directory contains useful maintenance and migration scripts:

### 1. Domain Migration Tool (`cmd/migrate_domain`)
Used when switching the media/image hosting domain (e.g. from `media-resource.sonata.io.vn` to `media.chabu.io.vn`). It scans and safely replaces old URLs inside:
- `posts`: `cover_image`, `content` (HTML with embedded images), `description`
- `post_translations`: `content`, `description`
- `categories`: `description`

#### Usage:
```bash
# Preview records to be affected without changing the database (Dry-run):
go run cmd/migrate_domain/main.go --dry-run

# Run migration (Default: media-resource.sonata.io.vn -> media.chabu.io.vn):
go run cmd/migrate_domain/main.go

# Custom domains:
go run cmd/migrate_domain/main.go --old="old-domain.com" --new="new-domain.com"
```

> **Important**: Also update `MINIO_ENDPOINT` in `.env` so new uploads will use the new domain.

---

### Other Scripts
- `cmd/migrate`: Database auto-migration.
- `cmd/seed`: Seed sample data.
- `cmd/sync_about`: Sync the about post.
- `cmd/sync_categories`: Sync categories.
- `cmd/upload_assets`: Upload static assets to MinIO.
