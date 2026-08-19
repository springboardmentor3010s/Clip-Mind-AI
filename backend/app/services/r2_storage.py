import boto3
from botocore.config import Config
from app.core.config import settings

def get_s3_client():
    # Cloudflare R2 uses the S3 API
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.r2_account_id}.r2.cloudflarestorage.com",
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        config=Config(signature_version="s3v4"),
        region_name="auto"
    )

def create_multipart_upload(s3_key: str, content_type: str = "video/mp4") -> str:
    """Initiates a multipart upload and returns the UploadId."""
    s3_client = get_s3_client()
    response = s3_client.create_multipart_upload(
        Bucket=settings.r2_bucket_name,
        Key=s3_key,
        ContentType=content_type
    )
    return response["UploadId"]

def generate_presigned_urls_for_parts(s3_key: str, upload_id: str, part_numbers: list[int]) -> dict[int, str]:
    """Generates presigned URLs for specific part numbers of a multipart upload."""
    s3_client = get_s3_client()
    presigned_urls = {}
    
    for part_number in part_numbers:
        url = s3_client.generate_presigned_url(
            ClientMethod="upload_part",
            Params={
                "Bucket": settings.r2_bucket_name,
                "Key": s3_key,
                "UploadId": upload_id,
                "PartNumber": part_number
            },
            ExpiresIn=3600 # 1 hour expiration
        )
        presigned_urls[part_number] = url
        
    return presigned_urls

def complete_multipart_upload(s3_key: str, upload_id: str, parts: list[dict]) -> dict:
    """Completes a multipart upload by providing all parts and their ETags."""
    s3_client = get_s3_client()
    response = s3_client.complete_multipart_upload(
        Bucket=settings.r2_bucket_name,
        Key=s3_key,
        UploadId=upload_id,
        MultipartUpload={"Parts": parts}
    )
    return response

def abort_multipart_upload(s3_key: str, upload_id: str):
    """Aborts a multipart upload and cleans up any uploaded parts."""
    s3_client = get_s3_client()
    s3_client.abort_multipart_upload(
        Bucket=settings.r2_bucket_name,
        Key=s3_key,
        UploadId=upload_id
    )

def delete_object(s3_key: str):
    """Deletes an object from R2 storage."""
    s3_client = get_s3_client()
    s3_client.delete_object(
        Bucket=settings.r2_bucket_name,
        Key=s3_key
    )

def generate_presigned_download_url(s3_key: str, expires_in: int = 3600) -> str:
    """Generates a presigned URL to stream/play a video from R2 storage."""
    s3_client = get_s3_client()
    url = s3_client.generate_presigned_url(
        ClientMethod="get_object",
        Params={
            "Bucket": settings.r2_bucket_name,
            "Key": s3_key
        },
        ExpiresIn=expires_in
    )
    return url

