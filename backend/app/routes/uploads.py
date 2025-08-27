"""
File upload routes for VeriHub API
"""
from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import List, Optional
import logging

from ..utils.cloudinary_service import cloudinary_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/upload/single")
async def upload_single_file(
    file: UploadFile = File(...),
    folder: Optional[str] = "verihub/uploads"
):
    """
    Upload a single file to Cloudinary
    
    Args:
        file: The uploaded file
        folder: Optional folder path in Cloudinary
        
    Returns:
        Upload result with file metadata
    """
    try:
        # Validate file
        file_content = await file.read()
        file_size = len(file_content)
        
        validation = cloudinary_service.validate_file(file.filename, file_size)
        if not validation["valid"]:
            raise HTTPException(status_code=400, detail=validation["error"])
        
        # Upload to Cloudinary
        result = await cloudinary_service.upload_file(
            file_content=file_content,
            filename=file.filename,
            folder=folder
        )
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["error"])
        
        logger.info(f"File uploaded successfully: {file.filename}")
        print("result: ", result)
        return {
            "message": "File uploaded successfully",
            "file_data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/upload/multiple")
async def upload_multiple_files(
    files: List[UploadFile] = File(...),
    folder: Optional[str] = "verihub/uploads"
):
    """
    Upload multiple files to Cloudinary
    
    Args:
        files: List of uploaded files
        folder: Optional folder path in Cloudinary
        
    Returns:
        List of upload results
    """
    try:
        if len(files) > 10:  # Limit to 10 files per request
            raise HTTPException(status_code=400, detail="Maximum 10 files allowed per request")
        
        file_data_list = []
        
        # Prepare files for upload
        for file in files:
            file_content = await file.read()
            file_size = len(file_content)
            
            # Validate each file
            validation = cloudinary_service.validate_file(file.filename, file_size)
            if not validation["valid"]:
                logger.warning(f"File validation failed: {file.filename} - {validation['error']}")
                file_data_list.append({
                    "content": None,
                    "filename": file.filename,
                    "error": validation["error"]
                })
                continue
            
            file_data_list.append({
                "content": file_content,
                "filename": file.filename
            })
        
        # Filter out invalid files
        valid_files = [f for f in file_data_list if f["content"] is not None]
        invalid_files = [f for f in file_data_list if f["content"] is None]
        
        # Upload valid files
        results = []
        if valid_files:
            results = await cloudinary_service.upload_multiple_files(valid_files, folder)
        
        # Add invalid file results
        for invalid_file in invalid_files:
            results.append({
                "success": False,
                "error": invalid_file["error"],
                "original_filename": invalid_file["filename"]
            })
        
        # Summary
        successful_uploads = [r for r in results if r["success"]]
        failed_uploads = [r for r in results if not r["success"]]
        
        logger.info(f"Batch upload complete: {len(successful_uploads)} successful, {len(failed_uploads)} failed")
        
        return {
            "message": f"Uploaded {len(successful_uploads)} of {len(files)} files successfully",
            "successful_uploads": len(successful_uploads),
            "failed_uploads": len(failed_uploads),
            "results": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Batch upload failed: {str(e)}")

@router.get("/file/{public_id}")
async def get_file_info(public_id: str):
    """
    Get file information and generate URLs
    
    Args:
        public_id: Cloudinary public ID
        
    Returns:
        File information and URLs
    """
    try:
        # Generate different sized URLs
        urls = {
            "original": cloudinary_service.get_file_url(public_id),
            "thumbnail": cloudinary_service.get_file_url(
                public_id, 
                {"width": 150, "height": 150, "crop": "thumb", "quality": "auto"}
            ),
            "medium": cloudinary_service.get_file_url(
                public_id,
                {"width": 600, "height": 600, "crop": "limit", "quality": "auto"}
            )
        }
        
        return {
            "public_id": public_id,
            "urls": urls
        }
        
    except Exception as e:
        logger.error(f"Error getting file info for {public_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get file information")

@router.delete("/file/{public_id}")
async def delete_file(public_id: str, resource_type: str = "image"):
    """
    Delete a file from Cloudinary
    
    Args:
        public_id: Cloudinary public ID
        resource_type: Type of resource (image, video, raw)
        
    Returns:
        Deletion result
    """
    try:
        result = cloudinary_service.delete_file(public_id, resource_type)
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["error"])
        
        logger.info(f"File deleted successfully: {public_id}")
        
        return {
            "message": "File deleted successfully",
            "public_id": public_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete error: {e}")
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")

@router.get("/health")
async def upload_service_health():
    """Check if Cloudinary upload service is healthy"""
    try:
        # Simple health check - verify configuration
        import cloudinary
        config = cloudinary.config()
        
        if not config.cloud_name or not config.api_key:
            return {"status": "unhealthy", "error": "Cloudinary not configured"}
        
        return {
            "status": "healthy",
            "cloud_name": config.cloud_name,
            "configured": True
        }
        
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
