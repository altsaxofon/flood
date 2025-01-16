import requests
from bs4 import BeautifulSoup
import pandas as pd
import time

# Base URL and total results
BASE_URL = "https://tidningar.kb.se/search"
QUERY_PARAMS = {
    "q": '"vattenkraft"',
    "offset": 0,  # Start offset
    "searchGranularity": "part",
    "to": "2023-12-30",
    "from": "2023-01-01"
}

# Function to extract data from a single page
def scrape_page(offset):
    QUERY_PARAMS["offset"] = offset
    response = requests.get(BASE_URL, params=QUERY_PARAMS)
    if response.status_code != 200:
        print(f"Failed to fetch page at offset {offset}, status code {response.status_code}")
        return []

    soup = BeautifulSoup(response.text, "html.parser")
    results = soup.find_all("a", class_="search-result-item-link")

    data = []
    for result in results:
        # Extract date
        date = result.find("p", class_="search-result-item-date").get_text(strip=True)

        # Extract paper title
        paper = result.find("div", class_="search-result-item-title").get_text(strip=True)

        # Extract snippets and combine them carefully
        snippets = result.find_all("span", class_="snippet")
        text = " ".join([snippet.get_text().strip() for snippet in snippets])  # Avoid over-stripping

        # Append to data list
        data.append({
            "date": date,
            "paper": paper,
            "text": text
        })
    
    return data

# Function to scrape all pages
def scrape_all():
    all_data = []
    offset = 0
    total_results = 1922
    results_per_page = 20

    while offset < total_results:
        print(f"Scraping offset: {offset}")
        page_data = scrape_page(offset)
        all_data.extend(page_data)
        offset += results_per_page
        time.sleep(1)  # Be polite to the server and avoid hammering it

    return all_data

# Save data to CSV using Pandas
def save_to_csv(data, filename="scraped_data.csv"):
    df = pd.DataFrame(data)
    df.to_csv(filename, index=False, encoding="utf-8")
    print(f"Data saved to {filename}")

# Save all text to TXT
def save_to_txt(data, filename="all_text.txt"):
    # Add proper spacing when joining text
    all_text = "\n\n".join([record["text"] for record in data])  # Newlines for readability
    with open(filename, mode="w", encoding="utf-8") as file:
        file.write(all_text)
    print(f"All text saved to {filename}")

# Main script
if __name__ == "__main__":
    print("Starting scraping...")
    scraped_data = scrape_all()
    
    # Save data to CSV
    save_to_csv(scraped_data)
    
    # Save all text to TXT
    save_to_txt(scraped_data)
    
    print("Scraping and saving completed.")