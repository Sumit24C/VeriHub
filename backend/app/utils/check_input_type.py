def get_input_with_type(query: str):

    if not query:
        print("⚠️ Please enter a valid claim or image URL")
        return ""
    
    # Simple detection for image URLs/paths
    image_extensions = ('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp')
    is_url = query.startswith(('http://', 'https://'))
    is_local_path = query.endswith(image_extensions)
    
    if is_url or is_local_path:
        confirm = input(f"🖼️ Detected as image. Proceed with image verification? (y/n): ").lower()
        if confirm in ['y', 'yes']:
            return query, "image"
    
    return query, "text"