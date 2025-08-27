from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

class ImageCheck(BaseModel):
    """Output of image verification (OCR + reverse image search)"""
    img_url: str = Field(..., description="Original image URL or uploaded reference")
    extracted_text: Optional[str] = Field(None, description="Text extracted from image (OCR)")
    img_found: bool = Field(..., description="Whether the image was found on the web")
    match_status: Optional[Literal["match", "partial_match", "no_match"]] = Field(
        None, description="Match status of image content (only if img_found is True)"
    )
    img_metadata: Optional[List[Dict[str, Any]]] = Field(
        None, description="List of metadata dicts for matched or partial_matches sources (title, link, snippet,image_scrape_content, etc.)"
    )

class TextCheck(BaseModel):
    """Output of text verification using multiple tools/APIs"""
    claim: str = Field(..., description="The input text claim to be verified")
    verified_status: Literal["true", "false", "unverified"] = Field(
        ..., description="Final fact-check result: 'true' if claim is correct, 'false' if incorrect, 'unverified' if inconclusive"
    )
    verified_from: Optional[List[str]] = Field(
        None, description="Sources that were used to confirm/refute the claim"
    )
    confidence_score: float = Field(
        ..., ge=0, le=1, description="Confidence score between 0.0 - 1.0"
    )
    reasoning: Optional[str] = Field(
        None, description="Brief explanation of why this status was assigned"
    )

class VerificationSummary(BaseModel):
    """Final merged verification summary (text + image if present)"""
    raw_input: str = Field(..., description="Raw user input (text claim or image url containing claim)")
    input_type: Literal["image", "text"] = Field(..., description="Either 'image' or 'text'")
    tools_used: List[str] = Field(default_factory=list, description="Tools/APIs used for verification")
    text_check: Optional[TextCheck] = Field(
        None, description="Text verification result"
    )
    img_check: Optional[ImageCheck] = Field(
        None, description="Image verification result if claim contained an image"
    )
    reasoned_summary: str = Field(default="", description="LLM generated reasoning for the verdict")
    result_from: str = Field(..., description="Tool that provided the successful result")
