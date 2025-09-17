from typing import Dict, Any
from langgraph.graph import StateGraph, END
from langchain.chat_models import init_chat_model
from langchain_core.messages import HumanMessage, SystemMessage
from .tools import VerificationService
from .prompts import VerificationCheckPrompts
from .models import VerificationSummary, TextCheck, ImageCheck
from .helper import format_sources_for_llm, extract_sources_from_factcheck_response, format_search_and_scrape_result

class Workflow:
    def __init__(self):
        self.tool = VerificationService()
        self.llm = init_chat_model(model="gemini-2.5-flash", model_provider="google-genai")
        self.ocr_llm = init_chat_model(model="gemini-2.5-flash", model_provider="google-genai")
        self.prompts = VerificationCheckPrompts()
        self.workflow = self._build_workflow()
        
    def _build_workflow(self):
        graph = StateGraph(VerificationSummary)
        graph.add_node("router", self._input_router)
        graph.add_node("img_check", self._img_check_node)
        graph.add_node("fact_check_node", self._fact_check_node)
        graph.add_node("twitter_node", self._twitter_node)
        graph.add_node("google_news_node", self._google_news_node)
        graph.add_node("summary", self._summary_node)  
        
        graph.set_entry_point("router")
        
        graph.add_conditional_edges("router", self._route_input, {
            "img_check": "img_check",
            "fact_check_node": "fact_check_node"
        })
        
        graph.add_conditional_edges("img_check",self._is_extracted_text, {
            "success": "fact_check_node",
            "failure": "summary"
        })   
        
        graph.add_conditional_edges("fact_check_node", self._result_router, {
            "success": "summary",   
            "failure": "twitter_node"  
        })

        graph.add_conditional_edges("twitter_node", self._result_router, {
            "success": "summary",   
            "failure": "google_news_node"  
        })

        graph.add_edge("google_news_node", "summary")
        graph.add_edge("summary", END)
        return graph.compile()
    
    def _input_router(self, state: VerificationSummary) -> Dict[str, Any]:
        """Process input and return state updates (not routing decision)."""
        # This node just passes through the state - routing is handled by _route_input
        return {}
    
    def _route_input(self, state: VerificationSummary) -> str:
        """Separate routing function for conditional edges."""
        if state.input_type == "image":
            return "img_check"
        elif state.input_type == "text":
            return "fact_check_node"
        else:
            raise ValueError(f"Unknown input type: {state.input_type}")
  
    """Image verification stages"""
    def _img_check_node(self, state: VerificationSummary) -> Dict[str, Any]:
        """Process image verification - extract text and perform reverse image search."""
        llm_generated_claim = ""   
        extracted_text = ""        

        try:
            # Run OCR
            extracted_text = self.tool.run_ocr("image.png") or ""
            tools_used = state.tools_used + ["ocr"]
            if not extracted_text.strip():
                # print("\nre-running easyocr")
                tools_used.append("2nd_ocr")
                extracted_text = self.tool.run_ocr("image.png") or ""

            # If OCR fails completely → return error
            if not extracted_text.strip():
                return self._create_img_error_response(
                    state=state,
                    llm_generated_claim="[OCR failed: no text]",
                    extracted_text="",
                    result_from="img_check_no_text",
                    img_found=False
                )

            print("\n Extracted_text: ", extracted_text)
            # Send OCR result to LLM for generalization
            ocr_messages = [
                SystemMessage(content=self.prompts.TEXT_GENERALIZATION_SYSTEM),
                HumanMessage(content=self.prompts.text_generation_user(extracted_text=extracted_text))
            ]
            
            llm_resp = self.ocr_llm.invoke(ocr_messages)
            llm_generated_claim = (getattr(llm_resp, "content", "") or "").strip() or extracted_text.strip()
            print("\n llm generated claim: ", llm_generated_claim)
            
            # Reverse image search
            image_search_results = self.tool.reverse_image_search(state.raw_input)
            tools_used.append("reverse_image_search")
            
            if not image_search_results:
                print("no img result")
                return self._create_img_error_response(
                    state=state,
                    llm_generated_claim=llm_generated_claim,
                    extracted_text=extracted_text,
                    result_from="img_check_no_results",
                    img_found=False
                )

            # Scrape image URLs content
            total_page_scraped = 0
            image_verification_result = []
            for image_search_result in image_search_results:
                url = image_search_result.get('link')
                if url: 
                    print("\n Scrapping link: ", url)
                    scrape_image_url_result = self.tool.scrape_page(url)
                    if "firecrawl_api" not in tools_used:
                        tools_used.append("firecrawl_api")
                    if scrape_image_url_result:
                        if total_page_scraped == 5:  
                            print("scraped all links")
                            break
                        total_page_scraped = total_page_scraped + 1
                        structured_data = {
                            **image_search_result,
                            "image_scrape_content": scrape_image_url_result.markdown[:1500]
                        }
                        image_verification_result.append(structured_data)
            print("Done generating verification results")
            
            # Verification LLM
            messages = [
                SystemMessage(content=self.prompts.IMAGE_VERIFICATION_SYSTEM),
                HumanMessage(content=self.prompts.img_verification_user(
                    claim=llm_generated_claim,
                    img_url=state.raw_input,
                    image_metadata=image_verification_result
                ))
            ]

            structured_llm = self.llm.with_structured_output(ImageCheck)
            result: ImageCheck = structured_llm.invoke(messages)
            # print("Match result of img_node: ", result)
            return {
                "claim": llm_generated_claim,
                "img_check": result,
                "tools_used":tools_used,
                "result_from": "img_check"
            }

        except Exception as e:
            print(f"Error in image check: {e}")
            return self._create_img_error_response(
                state=state,
                llm_generated_claim=llm_generated_claim,
                extracted_text=extracted_text,
                result_from="img_check_error",
                img_found=False
            )

    def _create_img_error_response(
        self,
        state: VerificationSummary,
        llm_generated_claim: str = "",
        extracted_text: str = "",
        result_from: str = "img_check_error",
        img_found: bool = False
    ) -> Dict[str, Any]:
        """Helper for consistent error responses."""
        return {
            "claim": llm_generated_claim or extracted_text or "",
            "img_check": ImageCheck(
                img_url=state.raw_input,
                img_found=img_found,
                extracted_text=llm_generated_claim or extracted_text or "",
                match_status=None,
                img_metadata=None
            ),
            "tools_used": state.tools_used + ["ocr", "reverse_image_search"],
            "result_from": result_from
        }
      
    def _is_extracted_text(self, state: VerificationSummary) -> str:
        """Route based on whether we got results from previous tool."""
        
        result_from = state.result_from if state and state.result_from else "" 
        if result_from == "img_check_no_text":
            return "failure"
        else:
            return "success"

    """Text verification stages"""
    def _fact_check_node(self, state: VerificationSummary) -> Dict[str, Any]:
        query = (state.img_check.extracted_text 
                if state.img_check and state.img_check.extracted_text 
                else state.raw_input)
        
        # print(f"🔍 Fact-checking query: {query}")
        fact_result = self.tool.fact_check(query=query)
        
        tools_used = state.tools_used + ["fact_check_api"]  
        
        if fact_result:
            extracted_sources = extract_sources_from_factcheck_response(fact_result)
            formatted_sources = format_sources_for_llm(extracted_sources)
            messages = [
                SystemMessage(content=self.prompts.TEXT_VERIFICATION_SYSTEM),
                HumanMessage(content=self.prompts.text_verification_user(
                    claim=query, 
                    sources=formatted_sources,
                    tools_used=tools_used
                ))
            ]
            
            structured_llm = self.llm.with_structured_output(TextCheck)
            try:
                result: TextCheck = structured_llm.invoke(messages)
                
                return {
                    "tools_used": tools_used,
                    "text_check": result,
                    "result_from": "fact_check_api"
                }
                
            except Exception as e:
                print(f"❌ Error in fact check LLM: {e}")
                return self._create_unverified_response(query, tools_used, state)
        else:
            print("⚠️ No fact check results returned")
            return self._create_unverified_response(query, tools_used,state)

    def _twitter_node(self, state: VerificationSummary) -> Dict[str, Any]:
        query = state.img_check.extracted_text if state.img_check and state.img_check.extracted_text else state.raw_input
        advanced_query_message = [
            SystemMessage(content=self.prompts.QUERY_GENERATION_TWEET_SEARCH_SYSTEM),
            HumanMessage(content=self.prompts.query_generation_tweet(query=query))
        ]
        
        advanced_query_response = self.llm.invoke(advanced_query_message)
        advanced_query = advanced_query_response.content
        tweet_results = self.tool.search_tweets(query=advanced_query)
        tools_used = state.tools_used + ["twitter-api"]  
        
        if tweet_results:
            messages = [
                SystemMessage(content=self.prompts.TEXT_VERIFICATION_SYSTEM),                
                HumanMessage(content=self.prompts.text_verification_user(
                    claim=query,
                    sources=tweet_results,
                    tools_used=tools_used
                ))
            ]
                
            structured_llm = self.llm.with_structured_output(TextCheck)
            try:
                result: TextCheck = structured_llm.invoke(messages)      
                # print("\n\ntweet result: ", result)              
                return {
                    "tools_used": tools_used,
                    "text_check": result,
                    "result_from": "twitter-api"
                }
                
            except Exception as e:
                print(f"Error in twitter LLM: {e}")
                return self._create_unverified_response(query, tools_used, state)
        else:
            print("No tweets found related to this")
            return self._create_unverified_response(query, tools_used, state)
            
    def _google_news_node(self, state: VerificationSummary) -> Dict[str, Any]:
        """Google News verification with content scraping"""
        query = (state.img_check.extracted_text 
                if state.img_check and state.img_check.extracted_text 
                else state.raw_input)
        
        google_news_results = self.tool.search_google_news(query=query)  
        tools_used = state.tools_used + ["google-news-api"]
        
        if google_news_results:
            
            formatted_result = []
            max_articles = min(10, len(google_news_results))
            
            for i, google_news_result in enumerate(google_news_results[:max_articles]):
                try:
                    if "firecrawl-api" not in tools_used:
                        tools_used.append('firecrawl-api')
                    
                    # print(f"Scraping article {i+1}/{max_articles}: {google_news_result.get('title', 'Unknown')}")
                    
                    article_url = google_news_result.get('link') 
                    if not article_url:
                        # print(f"Warning: No URL found for article {i+1}")
                        continue
                    
                    scrape_result = self.tool.scrape_page(url=article_url)
                    if scrape_result:
                        structured_data = format_search_and_scrape_result(scrape_result, google_news_result, article_url)
                        formatted_result.append(structured_data)
                    else:
                        print(f"Warning: Failed to scrape content from {article_url}")
                        
                except Exception as e:
                    print(f"Error scraping article {i+1}: {e}")
                    continue
            
            if formatted_result:
                messages = [
                    SystemMessage(content=self.prompts.TEXT_VERIFICATION_SYSTEM),   
                    HumanMessage(content=self.prompts.text_verification_user(
                        claim=query, 
                        sources=formatted_result, 
                        tools_used=tools_used
                    ))
                ]
                            
                structured_llm = self.llm.with_structured_output(TextCheck)
                try:
                    result: TextCheck = structured_llm.invoke(messages)        
                    return {
                        "tools_used": tools_used,
                        "text_check": result,
                        "result_from": "google-news-api"
                    }
                                
                except Exception as e:
                    print(f"Error in google news LLM: {e}")                    
                    return self._create_unverified_response(query, tools_used, state)
            else:
                print("Warning: No content was successfully scraped from any articles")
                return self._create_unverified_response(query, tools_used, state)
        else:
            print("No Google News results found")
            return self._create_unverified_response(query, tools_used,state)        
    
    def _result_router(self, state: VerificationSummary) -> str:
        """Route based on whether we got results from previous tool."""
        
        if not getattr(state, "result_from", None):
            return "failure"
        
        confidence = getattr(getattr(state, "text_check", None), "confidence_score", 0)
        if confidence > 0.7:
            return "success"
        return "failure"
    
    def _summary_node(self, state: VerificationSummary) -> Dict[str, Any]:
        """Generate final verification summary."""
        # print("Generating final recommendations")
        
        messages = [
            SystemMessage(content=self.prompts.VERIFICATION_SUMMARY_REASONING_SYSTEM),
            HumanMessage(content=self.prompts.verification_summary_reasoning_user(
                structured_verification=state.model_dump()
            ))
        ]
        
        try:
            result = self.llm.invoke(messages)
            summary_content = result.content if hasattr(result, 'content') else str(result)
            return {
                "reasoned_summary": summary_content         
            }
        except Exception as e:
            print(f"Error generating summary: {e}")
            return {
                "reasoned_summary": "Could not generate summary due to processing error."         
            }
    
    def _create_unverified_response(self, query: str, tools_used: list, state: VerificationSummary) -> Dict[str, Any]:
        """Helper method to create unverified response.
        If confidence < 0.7 and no new results, fallback to previous state results instead of resetting everything.
        """

        prev_text_check = state.text_check if state and state.text_check else None

        return {
            "text_check": TextCheck(
                claim=query,
                verified_status=(
                    prev_text_check.verified_status if prev_text_check and prev_text_check.verified_status
                    else "unverified"
                ),
                verified_from=(
                    prev_text_check.verified_from if prev_text_check and prev_text_check.verified_from
                    else None
                ),
                confidence_score=(
                    prev_text_check.confidence_score if prev_text_check and prev_text_check.confidence_score
                    else 0.0
                )
            ),
            "tools_used": tools_used,
            "result_from": state.result_from if state and state.result_from else ""
        }

    def run(self, input_type: str, raw_input: str) -> VerificationSummary:
        """Run the verification workflow."""
        initial_state = VerificationSummary(
            raw_input=raw_input,
            input_type=input_type,
            tools_used=[],
            text_check=None,
            img_check=None,
            reasoned_summary="",
            result_from=""
        )
        final_state = self.workflow.invoke(initial_state)
        return VerificationSummary(**final_state)
    
    def stream(self, input_type: str, raw_input: str):
        """Streaming execution (yields intermediate events)."""
        initial_state = VerificationSummary(
            raw_input=raw_input,
            input_type=input_type,
            tools_used=[],
            text_check=None,
            img_check=None,
            reasoned_summary="",
            result_from=""
        )
        for event in self.workflow.stream(initial_state, stream_mode="updates"):
            yield event
    
    def stream_response(self, input_type: str, raw_input: str):
        """Generator function that yields incremental results for each verification step."""
        import json
        import time
        
        # Yield initial status
        yield f"data: {json.dumps({
            'type': 'step_start', 
            'step': 'initializing',
            'title': 'Starting Verification Process',
            'content': 'Initializing verification workflow...',
            'progress': 10
        })}\n\n"
        
        try:
            # Execute the workflow with streaming updates
            initial_state = VerificationSummary(
                raw_input=raw_input,
                input_type=input_type,
                tools_used=[],
                text_check=None,
                img_check=None,
                reasoned_summary="",
                result_from=""
            )
            
            # Stream each step with detailed progress
            current_state = initial_state
            progress = 20
            
            for event in self.workflow.stream(initial_state, stream_mode="updates"):
                if event:
                    node_name = list(event.keys())[0] if event else "processing"
                    node_data = event.get(node_name, {})
                    
                    # Update current state
                    if isinstance(node_data, dict):
                        for key, value in node_data.items():
                            setattr(current_state, key, value)
                    
                    # Yield step-specific results immediately
                    if node_name == "router":
                        yield f"data: {json.dumps({
                            'type': 'step_complete',
                            'step': 'router',
                            'title': 'Input Analysis Complete',
                            'content': f'Detected input type: {input_type}',
                            'progress': 25,
                            'data': {'input_type': input_type, 'raw_input': raw_input[:100] + '...' if len(raw_input) > 100 else raw_input}
                        })}\n\n"
                        
                    elif node_name == "img_check":
                        img_check = getattr(current_state, 'img_check', None)
                        if img_check:
                            yield f"data: {json.dumps({
                                'type': 'step_complete',
                                'step': 'image_analysis',
                                'title': 'Image Analysis Complete',
                                'content': f'Text extracted: "{img_check.extracted_text[:100]}..."' if img_check.extracted_text else 'No text found in image',
                                'progress': 40,
                                'data': {
                                    'extracted_text': img_check.extracted_text,
                                    'img_found': img_check.img_found,
                                    'match_status': img_check.match_status
                                }
                            })}\n\n"
                        else:
                            yield f"data: {json.dumps({
                                'type': 'step_progress',
                                'step': 'image_analysis',
                                'title': 'Processing Image',
                                'content': 'Extracting text and analyzing image content...',
                                'progress': 35
                            })}\n\n"
                            
                    elif node_name == "fact_check_node":
                        text_check = getattr(current_state, 'text_check', None)
                        if text_check:
                            yield f"data: {json.dumps({
                                'type': 'step_complete',
                                'step': 'fact_check',
                                'title': 'Fact Check Complete',
                                'content': f'Status: {text_check.verified_status.upper()} (Confidence: {text_check.confidence_score:.1%})',
                                'progress': 55,
                                'data': {
                                    'verified_status': text_check.verified_status,
                                    'confidence_score': text_check.confidence_score,
                                    'verified_from': text_check.verified_from,
                                    'reasoning': text_check.reasoning[:200] + '...' if text_check.reasoning and len(text_check.reasoning) > 200 else text_check.reasoning
                                }
                            })}\n\n"
                        else:
                            yield f"data: {json.dumps({
                                'type': 'step_progress',
                                'step': 'fact_check',
                                'title': 'Fact Checking',
                                'content': 'Cross-referencing with reliable sources...',
                                'progress': 50
                            })}\n\n"
                            
                    elif node_name == "twitter_node":
                        text_check = getattr(current_state, 'text_check', None)
                        if text_check:
                            yield f"data: {json.dumps({
                                'type': 'step_complete',
                                'step': 'social_media',
                                'title': 'Social Media Analysis Complete',
                                'content': f'Found related tweets - Status: {text_check.verified_status.upper()}',
                                'progress': 70,
                                'data': {
                                    'verified_status': text_check.verified_status,
                                    'confidence_score': text_check.confidence_score,
                                    'source': 'Twitter/X',
                                    'reasoning': text_check.reasoning[:200] + '...' if text_check.reasoning and len(text_check.reasoning) > 200 else text_check.reasoning
                                }
                            })}\n\n"
                        else:
                            yield f"data: {json.dumps({
                                'type': 'step_progress',
                                'step': 'social_media',
                                'title': 'Social Media Search',
                                'content': 'Searching Twitter/X for related posts...',
                                'progress': 65
                            })}\n\n"
                            
                    elif node_name == "google_news_node":
                        text_check = getattr(current_state, 'text_check', None)
                        if text_check:
                            yield f"data: {json.dumps({
                                'type': 'step_complete',
                                'step': 'news_analysis',
                                'title': 'News Analysis Complete',
                                'content': f'Analyzed news articles - Final status: {text_check.verified_status.upper()}',
                                'progress': 85,
                                'data': {
                                    'verified_status': text_check.verified_status,
                                    'confidence_score': text_check.confidence_score,
                                    'source': 'Google News',
                                    'reasoning': text_check.reasoning[:200] + '...' if text_check.reasoning and len(text_check.reasoning) > 200 else text_check.reasoning
                                }
                            })}\n\n"
                        else:
                            yield f"data: {json.dumps({
                                'type': 'step_progress',
                                'step': 'news_analysis',
                                'title': 'News Search',
                                'content': 'Analyzing news articles and reports...',
                                'progress': 80
                            })}\n\n"
                            
                    elif node_name == "summary":
                        yield f"data: {json.dumps({
                            'type': 'step_progress',
                            'step': 'summary',
                            'title': 'Generating Summary',
                            'content': 'Creating comprehensive verification report...',
                            'progress': 90
                        })}\n\n"
                        
                    # Small delay for visual effect
                    time.sleep(0.2)
            
            # Get final result
            final_result = VerificationSummary(**current_state.__dict__)
            
            # Stream final summary
            if final_result.reasoned_summary:
                yield f"data: {json.dumps({
                    'type': 'step_complete',
                    'step': 'summary',
                    'title': 'Verification Summary',
                    'content': final_result.reasoned_summary[:300] + '...' if len(final_result.reasoned_summary) > 300 else final_result.reasoned_summary,
                    'progress': 95,
                    'data': {'summary': final_result.reasoned_summary}
                })}\n\n"
            
            # Send final completion with full result
            yield f"data: {json.dumps({
                'type': 'complete',
                'progress': 100,
                'title': 'Verification Complete',
                'content': 'All verification steps completed successfully!',
                'result': final_result.model_dump()
            })}\n\n"
            
        except Exception as e:
            error_msg = f"Error during verification: {str(e)}"
            yield f"data: {json.dumps({
                'type': 'error',
                'step': 'error',
                'title': 'Verification Error',
                'content': error_msg,
                'progress': 0
            })}\n\n"
        
        # End the stream
        yield "data: [DONE]\n\n"
