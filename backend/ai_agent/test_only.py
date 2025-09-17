from dotenv import load_dotenv
from src.workflow import Workflow
import json
import re

load_dotenv()

def extract_summary_from_json(summary_text):
    """Extract clean summary from JSON formatted text"""
    try:
        # Handle markdown JSON blocks
        if "```json" in summary_text:
            json_match = re.search(r'```json\n(.*?)\n```', summary_text, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
                parsed = json.loads(json_str)
                return parsed.get('reasoned_summary', summary_text)
        
        # Handle direct JSON
        elif summary_text.strip().startswith('{'):
            parsed = json.loads(summary_text)
            return parsed.get('reasoned_summary', summary_text)
            
        return summary_text
    except (json.JSONDecodeError, AttributeError):
        return summary_text

def format_verification_result(result):
    """Format the verification result for better readability"""
    
    # Status icons and colors
    status_icons = {
        "true": "✅ VERIFIED AS TRUE",
        "false": "❌ VERIFIED AS FALSE", 
        "unverified": "⚠️ UNVERIFIED"
    }
    
    confidence_level = ""
    if result.text_check and result.text_check.confidence_score:
        score = result.text_check.confidence_score
        if score >= 0.8:
            confidence_level = "🟢 High"
        elif score >= 0.6:
            confidence_level = "🟡 Medium"
        elif score >= 0.3:
            confidence_level = "🟠 Low"
        else:
            confidence_level = "🔴 Very Low"
    
    print("\n" + "="*70)
    print("🔍 FACT-CHECK RESULTS")
    print("="*70)
    
    # Main verdict
    if result.text_check:
        status = result.text_check.verified_status
        print(f"\n🎯 VERDICT: {status_icons.get(status, status.upper())}")
        
        if result.text_check.confidence_score:
            print(f"📊 Confidence: {confidence_level} ({result.text_check.confidence_score:.1%})")
    
    # Tools used
    if result.tools_used:
        print(f"🛠️ Verification Tools: {', '.join(result.tools_used)}")
    
    if result.result_from:
        print(f"📍 Primary Source: {result.result_from}")
    
    # Image analysis (if present)
    if result.img_check:
        print(f"\n🖼️ IMAGE ANALYSIS:")
        print(f"   • Image Found: {'Yes' if result.img_check.img_found else 'No'}")
        if result.img_check.extracted_text:
            print(f"   • Extracted Text: \"{result.img_check.extracted_text}\"")
        if result.img_check.match_status:
            print(f"   • Match Status: {result.img_check.match_status}")
    
    # Sources
    if result.text_check and result.text_check.verified_from:
        print(f"\n📚 SOURCES:")
        print(f"{result.text_check.verified_from}")
    
    # Reasoning
    if result.text_check and result.text_check.reasoning:
        print(f"\n💭 ANALYSIS:")
        print(f"   {result.text_check.reasoning}")
    
    # Summary
    if result.reasoned_summary:
        clean_summary = extract_summary_from_json(result.reasoned_summary)
        print(f"\n📋 SUMMARY:")
        print(f"   {clean_summary}")
    
    print("\n" + "="*70)

def get_input_with_type():
    """Get user input and determine if it's text or image"""
    print("\n" + "="*50)
    print("🤖 FACT-CHECKER AI AGENT")
    print("="*50)
    print("Options:")
    print("  📝 Enter text claim to verify")
    print("  🖼️ Enter image URL/path for image verification") 
    print("  ❌ Type 'quit' or 'exit' to stop")
    print("-"*50)
    
    query = input("🔍 Enter your claim or image URL: ").strip()
    
    if query.lower() in {"quit", "exit", "q"}:
        return None, None
    
    if not query:
        print("⚠️ Please enter a valid claim or image URL")
        return get_input_with_type()
    
    # Simple detection for image URLs/paths
    image_extensions = ('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp')
    is_url = query.startswith(('http://', 'https://'))
    is_local_path = query.endswith(image_extensions)
    
    if is_url or is_local_path:
        confirm = input(f"🖼️ Detected as image. Proceed with image verification? (y/n): ").lower()
        if confirm in ['y', 'yes']:
            return query, "image"
    
    return query, "text"

def test_streaming():
    """Test the streaming functionality with sample data"""
    print("\n🚀 Testing Streaming Functionality...")
    
    try:
        workflow = Workflow()
        print("✅ Workflow initialized successfully!")
        
        # Test with a simple text query
        test_query = "The COVID-19 vaccine contains microchips."
        input_type = "text"
        
        print(f"\n🧪 Testing streaming with query: \"{test_query}\"")
        print("📡 Streaming response chunks:")
        print("-" * 60)
        
        chunk_count = 0
        step_count = 0
        for chunk in workflow.stream_response(input_type=input_type, raw_input=test_query):
            chunk_count += 1
            chunk_data = chunk.strip()
            
            # Parse the streaming data to show structured output
            if chunk_data.startswith('data: {'):
                try:
                    import json
                    event_data = json.loads(chunk_data[6:])  # Remove 'data: '
                    event_type = event_data.get('type', 'unknown')
                    
                    if event_type in ['step_start', 'step_complete', 'step_progress']:
                        step_count += 1
                        step_title = event_data.get('title', 'Unknown Step')
                        step_content = event_data.get('content', '')
                        progress = event_data.get('progress', 0)
                        
                        status_icon = {
                            'step_start': '⚡',
                            'step_progress': '🔄',
                            'step_complete': '✅'
                        }.get(event_type, '🔍')
                        
                        print(f"[Step {step_count:02d}] {status_icon} {step_title} ({progress}%)")
                        print(f"         {step_content}")
                        
                        # Show verification data if available
                        if 'data' in event_data and event_data['data']:
                            data = event_data['data']
                            if 'verified_status' in data:
                                confidence = data.get('confidence_score', 0) * 100
                                print(f"         🎯 Result: {data['verified_status'].upper()} ({confidence:.0f}% confidence)")
                    
                    elif event_type == 'complete':
                        print(f"\n✅ VERIFICATION COMPLETE!")
                        print(f"    Final Status: {event_data.get('content', 'Done')}")
                    
                    elif event_type == 'error':
                        print(f"\n❌ ERROR: {event_data.get('content', 'Unknown error')}")
                    
                except json.JSONDecodeError:
                    print(f"[Chunk {chunk_count:02d}] {chunk_data}")
            else:
                print(f"[Chunk {chunk_count:02d}] {chunk_data}")
            
            # Add a small delay to see streaming effect
            import time
            time.sleep(0.1)
        
        print("-" * 60)
        print(f"✅ Streaming test completed! Received {chunk_count} chunks.")
        
    except Exception as e:
        print(f"❌ Error during streaming test: {e}")
        import traceback
        traceback.print_exc()

def main():
    print("🚀 Starting Fact-Checker AI Agent...")
    
    # Ask user if they want to test streaming
    test_choice = input("Would you like to test streaming functionality? (y/n): ").lower()
    if test_choice in ['y', 'yes']:
        test_streaming()
        return
    
    try:
        workflow = Workflow()
        print("✅ Workflow initialized successfully!")
    except Exception as e:
        print(f"❌ Error initializing workflow: {e}")
        return
    
    while True:
        try:
            query, input_type = get_input_with_type()
            
            if query is None:  # User wants to quit
                print("👋 Thank you for using Fact-Checker AI! Goodbye!")
                break
            
            print(f"\n🔄 Processing {input_type} verification...")
            print(f"📝 Query: \"{query}\"")
            
            # Run verification
            # for event in workflow.stream(input_type=input_type, raw_input=query):
            #     print("Event: ",event)
            result = workflow.run(input_type=input_type, raw_input=query)
            
            # Display formatted results
            format_verification_result(result)
            
            # Option to continue
            continue_check = input("\n🔄 Check another claim? (y/n): ").lower()
            if continue_check not in ['y', 'yes', '']:
                print("👋 Thank you for using Fact-Checker AI! Goodbye!")
                break
                
        except KeyboardInterrupt:
            print("\n\n👋 Session interrupted. Goodbye!")
            break
        except Exception as e:
            print(f"\n❌ Error during verification: {e}")
            print("🔄 Please try again with a different query.")

if __name__ == "__main__":
    main()