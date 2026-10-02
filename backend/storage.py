import os
import io
from typing import Optional

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MINIO_BUCKET = os.getenv("MINIO_BUCKET", "spss-datasets")

class StorageService:
    def __init__(self):
        self.client = None
        try:
            from minio import Minio
            self.client = Minio(
                MINIO_ENDPOINT,
                access_key=MINIO_ACCESS_KEY,
                secret_key=MINIO_SECRET_KEY,
                secure=False
            )
        except Exception:
            # MinIO not reachable, will fallback to local file system
            self.client = None

    def upload_dataset_blob(self, object_name: str, data_bytes: bytes, content_type: str = "application/octet-stream") -> str:
        """Uploads dataset file to MinIO bucket or local storage."""
        if self.client:
            try:
                if not self.client.bucket_exists(MINIO_BUCKET):
                    self.client.make_bucket(MINIO_BUCKET)
                self.client.put_object(
                    MINIO_BUCKET,
                    object_name,
                    io.BytesIO(data_bytes),
                    length=len(data_bytes),
                    content_type=content_type
                )
                return f"s3://{MINIO_BUCKET}/{object_name}"
            except Exception as e:
                print(f"MinIO upload warning: {e}")

        # Local storage fallback
        local_dir = os.path.abspath("./storage_blobs")
        os.makedirs(local_dir, exist_ok=True)
        local_path = os.path.join(local_dir, object_name)
        with open(local_path, "wb") as f:
            f.write(data_bytes)
        return f"file://{local_path}"

storage_service = StorageService()
