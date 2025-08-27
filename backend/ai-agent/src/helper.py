def format_sources_for_llm(extracted_sources: list) -> str:
    """Format extracted sources into a clear structure for the LLM"""
    if not extracted_sources:
        return "No sources available"
    
    formatted_sources = "FACT-CHECK SOURCES:\n\n"
    
    for i, source in enumerate(extracted_sources, 1):
        formatted_sources += f"""Source {i}:
            Publisher: {source['publisher']} ({source['publisher_site']})
            URL: {source['url']}
            Title: {source['title']}
            Review Date: {source['review_date']}
            Rating/Verdict: {source['rating']}
            Claim Reviewed: {source['claim_text']}
            Claimant: {source['claimant']}
            ---

            """
    
    return formatted_sources

def extract_sources_from_factcheck_response(fact_result: dict) -> list:
    """Extract and format sources from fact-check API response"""
    extracted_sources = []
    
    if not fact_result or 'claims' not in fact_result:
        return extracted_sources
    
    for claim in fact_result['claims']:
        claim_text = claim.get('text', '')
        claimant = claim.get('claimant', 'Unknown')
        claim_date = claim.get('claimDate', '')
        
        for review in claim.get('claimReview', []):
            source_info = {
                'claim_text': claim_text,
                'claimant': claimant,
                'claim_date': claim_date,
                'publisher': review.get('publisher', {}).get('name', 'Unknown'),
                'publisher_site': review.get('publisher', {}).get('site', ''),
                'url': review.get('url', ''),
                'title': review.get('title', ''),
                'review_date': review.get('reviewDate', ''),
                'rating': review.get('textualRating', ''),
                'language': review.get('languageCode', 'en')
            }
            extracted_sources.append(source_info)
    
    return extracted_sources

def format_search_and_scrape_result(scrape_result, google_news_result, article_url) -> dict:
    """Extract content and title from a Document object returned by scraping tool"""

    structured_data = {    
        "link": google_news_result.get("link"),
        "name": google_news_result.get("source", {}).get("name") if isinstance(google_news_result.get("source"), dict) else None,
        "title": google_news_result.get("title"),
        "date": google_news_result.get("date"),
        "content": scrape_result.markdown[:2500],
        "url": article_url
    }
    
    return structured_data

# nlp = spacy.load("en_core_web_sm")

# def validate_entities(extracted_text: str, llm_claim: str) -> bool:
#     """
#     Check if all key entities from OCR text are present in LLM-generated claim.
#     Returns True if all entities are present, else False.
#     """
#     doc = nlp(extracted_text)
#     entities = set([ent.text for ent in doc.ents])
    
#     # Add numbers/dates not caught by spaCy
#     numbers = set(re.findall(r'\d[\d.,%]*', extracted_text))
#     entities.update(numbers)
    
#     missing = [e for e in entities if e not in llm_claim]
    
#     return len(missing) == 0