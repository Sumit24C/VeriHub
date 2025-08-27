"""
Cloudinary service for file upload and management
"""
import cloudinary
import cloudinary.uploader
import cloudinary.api
from cloudinary.exceptions import Error as CloudinaryError
import os
import logging
from typing import List, Dict, Any, Optional
import asyncio
from functools import wraps
from pathlib import Path
import io

from ..core.config import settings

logger = logging.getLogger(__name__)

class CloudinaryService:
    """Service for handling Cloudinary uploads and operations"""
    
    def __init__(self):
        """Initialize Cloudinary configuration"""
        try:
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=settings.CLOUDINARY_SECURE
            )
            self.configured = bool(settings.CLOUDINARY_CLOUD_NAME and 
                                 settings.CLOUDINARY_API_KEY and 
                                 settings.CLOUDINARY_API_SECRET)
            
            if self.configured:
                logger.info("Cloudinary configured successfully")
            else:
                logger.warning("Cloudinary configuration incomplete - check environment variables")
                
        except Exception as e:
            logger.error(f"Failed to configure Cloudinary: {e}")
            self.configured = False
    
    def configure_cloudinary(self):
        """Configure Cloudinary with environment variables"""
        # This method is deprecated - configuration is done in __init__
        pass
    
    async def upload_file(
        self, 
        file_content: bytes, 
        filename: str,
        folder: str = "verihub/uploads",
        resource_type: str = "auto"
    ) -> Dict[str, Any]:
        """
        Upload file to Cloudinary
        
        Args:
            file_content: The file content as bytes
            filename: Original filename
            folder: Cloudinary folder to store the file
            resource_type: Type of resource (auto, image, video, raw)
            
        Returns:
            Dict containing upload result and metadata
        """
        try:
            # Extract file extension for better handling
            file_extension = Path(filename).suffix.lower()
            
            # Determine resource type if auto
            if resource_type == "auto":
                if file_extension in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']:
                    resource_type = "image"
                elif file_extension in ['.mp4', '.avi', '.mov', '.mkv']:
                    resource_type = "video"
                else:
                    resource_type = "raw"  # For PDFs, docs, etc.
            
            # Upload options
            upload_options = {
                "folder": folder,
                "resource_type": resource_type,
                "use_filename": True,
                "unique_filename": True,
                "overwrite": False,
                "tags": ["verihub", "user_upload"],
                "context": {
                    "original_filename": filename,
                    "uploaded_by": "verihub_api"
                }
            }
            
            # Add image-specific options
            if resource_type == "image":
                upload_options.update({
                    "transformation": [
                        {"quality": "auto", "fetch_format": "auto"},
                        {"angle": "auto_right"}  # Auto-rotate based on EXIF
                    ],
                    "eager": [
                        {"width": 300, "height": 300, "crop": "fill", "quality": "auto"},
                        {"width": 150, "height": 150, "crop": "thumb", "quality": "auto"}
                    ]
                })
            
            # Perform upload
            result = cloudinary.uploader.upload(file_content, **upload_options)
            
            logger.info(f"Successfully uploaded file: {filename} -> {result['public_id']}")
            
            # Return structured response
            return {
                "success": True,
                "public_id": result["public_id"],
                "url": result["secure_url"],
                "original_filename": filename,
                "cloudinary_filename": result.get("original_filename", filename),
                "resource_type": result["resource_type"],
                "format": result.get("format"),
                "width": result.get("width"),
                "height": result.get("height"),
                "bytes": result["bytes"],
                "created_at": result["created_at"],
                "version": result["version"],
                "folder": folder,
                "tags": result.get("tags", []),
                "eager": result.get("eager", [])  # Thumbnail URLs
            }
            
        except CloudinaryError as e:
            logger.error(f"Cloudinary upload error for {filename}: {e}")
            return {
                "success": False,
                "error": f"Cloudinary error: {str(e)}",
                "original_filename": filename
            }
        except Exception as e:
            logger.error(f"Unexpected error uploading {filename}: {e}")
            return {
                "success": False,
                "error": f"Upload failed: {str(e)}",
                "original_filename": filename
            }
    
    async def upload_multiple_files(
        self, 
        files: list,
        folder: str = "verihub/uploads"
    ) -> list:
        """
        Upload multiple files to Cloudinary
        
        Args:
            files: List of file data (each containing content and filename)
            folder: Cloudinary folder to store files
            
        Returns:
            List of upload results
        """
        results = []
        
        for file_data in files:
            result = await self.upload_file(
                file_content=file_data["content"],
                filename=file_data["filename"],
                folder=folder
            )
            results.append(result)
        
        return results
    
    def get_file_url(
        self, 
        public_id: str, 
        transformation: Optional[Dict] = None,
        resource_type: str = "image"
    ) -> str:
        """
        Generate URL for a file with optional transformations
        
        Args:
            public_id: Cloudinary public ID
            transformation: Optional transformation parameters
            resource_type: Type of resource
            
        Returns:
            Generated URL
        """
        try:
            if transformation:
                return cloudinary.CloudinaryImage(public_id).build_url(**transformation)
            else:
                return cloudinary.CloudinaryImage(public_id).build_url()
        except Exception as e:
            logger.error(f"Error generating URL for {public_id}: {e}")
            return ""
    
    def delete_file(self, public_id: str, resource_type: str = "image") -> Dict[str, Any]:
        """
        Delete a file from Cloudinary
        
        Args:
            public_id: Cloudinary public ID
            resource_type: Type of resource
            
        Returns:
            Deletion result
        """
        try:
            result = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
            logger.info(f"Deleted file: {public_id}")
            return {"success": True, "result": result}
        except Exception as e:
            logger.error(f"Error deleting {public_id}: {e}")
            return {"success": False, "error": str(e)}
    
    def validate_file(self, filename: str, file_size: int) -> Dict[str, Any]:
        """
        Validate file before upload
        
        Args:
            filename: Original filename
            file_size: File size in bytes
            
        Returns:
            Validation result
        """
        # File size limit (10MB)
        max_size = 10 * 1024 * 1024
        if file_size > max_size:
            return {
                "valid": False,
                "error": f"File {filename} is too large. Maximum size is 10MB."
            }
        
        # Allowed file extensions
        allowed_extensions = {
            '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp',  # Images
            '.pdf',  # Documents
            '.doc', '.docx',  # Word documents
            '.txt',  # Text files
            '.mp4', '.avi', '.mov'  # Videos (if needed later)
        }
        
        file_extension = Path(filename).suffix.lower()
        if file_extension not in allowed_extensions:
            return {
                "valid": False,
                "error": f"File type {file_extension} is not supported."
            }
        
        return {"valid": True}

# Global instance
cloudinary_service = CloudinaryService()
