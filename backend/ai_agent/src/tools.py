import os
import requests
from dotenv import load_dotenv
from firecrawl import FirecrawlApp
import easyocr
from serpapi import GoogleSearch
load_dotenv()

class VerificationService:

    def __init__(self):
        # API keys
        self.SERPAPI_KEY = os.getenv("SERPAPI_KEY")
        self.FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY")
        self.FACTCHECK_API_KEY = os.getenv("FACTCHECK_API_KEY")
        self.X_BEARER_TOKEN = os.getenv("X_BEARER_TOKEN")

        # Initialize Firecrawl client
        if self.FIRECRAWL_API_KEY:
            self.firecrawl = FirecrawlApp(api_key=self.FIRECRAWL_API_KEY)
        else:
            raise ValueError("Missing FIRECRAWL_API_KEY environment variable")

        # Validate required keys
        if not self.SERPAPI_KEY:
            raise ValueError("Missing SERPAPI_KEY environment variable")
        if not self.X_BEARER_TOKEN:
            raise ValueError("Missing X_BEARER_TOKEN environment variable")

    def reverse_image_search(self, img_url: str, num_results: int = 10):
        try:
            params = {
                "engine": "google_reverse_image",
                "image_url": img_url,
                "api_key": self.SERPAPI_KEY
            }
            search = GoogleSearch(params)
            results = search.get_dict()
            image_result = results["image_results"]
            
            structured_results = []
            for item in image_result:
                structured_results.append({
                    "title": item.get("title"),
                    "link": item.get("link"),
                    "source": item.get("source"),
                    "date": item.get("date"),
                    "snippet": item.get("snippet"),
                    "thumbnail": item.get("thumbnail"),
                })

            return structured_results

        except Exception as e:
            print(f"Reverse Image Search error: {e}")
            return []

    def search_google_news(self, query: str, num_results: int = 10):
        try:
            params = {
                "engine": "google_news",
                "q": query,
                "api_key": self.SERPAPI_KEY
            }
            search = GoogleSearch(params)
            results = search.get_dict()
            return results.get("news_results", [])[:num_results]
        except Exception as e:
            print(f"Google News Search error: {e}")
            return []

    def fact_check(self, query: str, page_size: int = 10):
        """Verify text claims using Google's FactCheck API."""
        try:
            url = "https://factchecktools.googleapis.com/v1alpha1/claims:search"
            params = {
                "query": query,
                "languageCode": "en-US",
                "pageSize": page_size,
                "key": self.FACTCHECK_API_KEY
            }
            response = requests.get(url, params=params, timeout=20)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"FactCheck API error: {e}")
            return {}

    def scrape_page(self, url: str):
        """Scrape a webpage using Firecrawl."""
        if not self.firecrawl:
            print("Firecrawl API not initialized.")
            return None
        try:
            res = self.firecrawl.scrape(url, formats=["markdown"])
            return res
        except Exception as e:
            print(f"Firecrawl scrape error: {e}")
            return None

    def search_tweets(self, query: str, max_results: int = 10):
        """Search recent tweets using Twitter/X API."""
        print("query", query)
        try:
            url = "https://api.x.com/2/tweets/search/recent"
            params = {
                "query": query,
                "max_results": max_results,
                "tweet.fields": "id,text,author_id,created_at",
                "expansions": "author_id",
                "user.fields": "id,name,username,verified,verified_type"
            }
            headers = {"Authorization": f"Bearer {self.X_BEARER_TOKEN}"}
            response = requests.get(url, headers=headers, params=params, timeout=20)
            response.raise_for_status()
            tweet_result = response.json()
            users = {user["id"]: user for user in tweet_result.get("includes", {}).get("users", [])}

            structured_tweets = []
            for tweet in tweet_result.get("data", []):
                user = users.get(tweet["author_id"], {})
                structured_data = {
                    "tweet_id": tweet["id"],
                    "author_id": tweet["author_id"],
                    "author_name": user.get("name"),
                    "username": user.get("username"),
                    "verified": user.get("verified"),
                    "verified_type": user.get("verified_type"),
                    "text": tweet["text"],
                    "created_at": tweet.get("created_at"),
                    "edit_history_tweet_ids": tweet.get("edit_history_tweet_ids", []),
                }
                structured_tweets.append(structured_data)
            return structured_tweets
        except Exception as e:
            print(f"Twitter/X search error: {e}")
            return []

    # ---------------- OCR ---------------- #
    def run_ocr(self, img_path: str):
        """Extract text from image using EasyOCR."""
        try:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            abs_path = os.path.join(base_dir, img_path)

            if not os.path.exists(abs_path):
                raise FileNotFoundError(f"Image not found at: {abs_path}")

            # Load reader once for performance (optional: move to __init__)
            ocr_reader = easyocr.Reader(['en'])
            results = ocr_reader.readtext(abs_path)

            extracted_text = " ".join([res[1] for res in results])
            return extracted_text.strip()      
              
        except Exception as e:
            print(f"OCR error: {e}")
            return ""
