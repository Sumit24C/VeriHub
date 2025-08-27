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

def main():
    print("🚀 Starting Fact-Checker AI Agent...")
    
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