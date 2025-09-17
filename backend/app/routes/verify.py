from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from fastapi.responses import StreamingResponse
from ai_agent.src.workflow import Workflow
import os
import shutil
import inspect
import ai_agent.src.workflow as wf  # to locate workflow.py dynamically
from ..utils.cloudinary_service import cloudinary_service
from ..utils.check_input_type import get_input_with_type
from ..auth.auth_service import get_current_user
from ..models.user import UserInDB

router = APIRouter()
workflow = Workflow()

# Dynamically get the real src/ directory where workflow.py lives
SRC_DIR = os.path.dirname(inspect.getfile(wf))

# Fixed filename for OCR (workflow expects "image.png")
IMAGE_PATH = os.path.join(SRC_DIR, "image.png")


@router.post("/verify")
async def verify_content(
    input_type: str = Form(...),
    raw_input: str = Form(None),
    file: UploadFile = File(None)
):
    try:
        if file:  # Case: Image file uploaded
            # Always save as "image.png" in src/ so workflow.py can pick it up
            with open(IMAGE_PATH, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # Upload to Cloudinary (optional, for external URL storage)
            with open(IMAGE_PATH, "rb") as f:
                file_content = f.read()

            upload_result = await cloudinary_service.upload_file(
                file_content=file_content,
                filename=file.filename,
                folder="verihub/verify"
            )

            if not upload_result["success"]:
                raise HTTPException(status_code=500, detail=upload_result["error"])

            img_link = upload_result.get("url") or upload_result.get("secure_url")

            # Run workflow (depends on image.png existing)
            result = workflow.run(input_type="image", raw_input=img_link)

        else:  # Case: Text input
            if not raw_input:
                raise HTTPException(status_code=400, detail="No input provided")

            # Detect proper input type
            query, detected_type = get_input_with_type(query=raw_input)
            result = workflow.run(input_type=detected_type, raw_input=query)

        return result.model_dump()

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Cleanup image.png only if it exists
        if os.path.exists(IMAGE_PATH):
            try:
                os.remove(IMAGE_PATH)
            except Exception:
                pass


@router.post("/stream-chat")
async def stream_chat(
    input_type: str = Form(...),
    raw_input: str = Form(None),
    file: UploadFile = File(None),
    current_user: UserInDB = Depends(get_current_user)  # Authentication required
):
    """
    Server-Sent Events endpoint for streaming AI responses.
    Streams verification results token by token in real-time.
    """
    
    def generate_stream():
        try:
            processed_input = None
            detected_type = input_type
            
            if file:  # Case: Image file uploaded
                # Always save as "image.png" in src/ so workflow.py can pick it up
                with open(IMAGE_PATH, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)

                # Upload to Cloudinary (optional, for external URL storage)
                with open(IMAGE_PATH, "rb") as f:
                    file_content = f.read()

                # Note: For streaming, we'll use a simpler approach and just use the local file
                # In production, you might want to handle Cloudinary upload in a separate step
                processed_input = "image.png"  # Use local path for workflow
                detected_type = "image"
                
            else:  # Case: Text input
                if not raw_input:
                    yield f"data: {{\"type\": \"error\", \"content\": \"No input provided\"}}\n\n"
                    return
                
                # Detect proper input type
                processed_input, detected_type = get_input_with_type(query=raw_input)
            
            # Stream the workflow execution
            for chunk in workflow.stream_response(input_type=detected_type, raw_input=processed_input):
                yield chunk
                
        except Exception as e:
            yield f"data: {{\"type\": \"error\", \"content\": \"Error during streaming: {str(e)}\"}}\n\n"
        
        finally:
            # Cleanup image.png only if it exists
            if os.path.exists(IMAGE_PATH):
                try:
                    os.remove(IMAGE_PATH)
                except Exception:
                    pass
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )
