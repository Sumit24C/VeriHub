from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from ai_agent.src.workflow import Workflow
import os
import shutil
from ..utils.cloudinary_service import cloudinary_service
from ..utils.check_input_type import get_input_with_type

router = APIRouter()
workflow = Workflow()

# Store temp files inside src directory where workflow.py is
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(BASE_DIR, "../../src")
TEMP_DIR = os.path.join(SRC_DIR, "temp")
os.makedirs(TEMP_DIR, exist_ok=True)


@router.post("/verify")
async def verify_content(
    input_type: str = Form(...),
    raw_input: str = Form(None),
    file: UploadFile = File(None)
):
    temp_path = None
    try:
        if file:  # Case: Image file uploaded
            # Save temp file in src/temp
            temp_path = os.path.join(TEMP_DIR, file.filename)
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # Upload to Cloudinary
            with open(temp_path, "rb") as f:
                file_content = f.read()

            upload_result = await cloudinary_service.upload_file(
                file_content=file_content,
                filename=file.filename,
                folder="verihub/verify"
            )

            if not upload_result["success"]:
                raise HTTPException(status_code=500, detail=upload_result["error"])

            img_link = upload_result.get("url") or upload_result.get("secure_url")

            # Pass to workflow as image input
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
        # Always cleanup temp file
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
