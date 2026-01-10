# Google Maps Business Data Extractor - Setup Guide

## Quick Start

### 1. Get Your Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Places API (New)** - this is critical, not the old Places API
4. Go to **Credentials** → Create **API Key**
5. (Optional but recommended) Restrict your API key:
   - API restrictions: Select "Places API (New)"
   - Application restrictions: Set based on your use case

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

Or simply:
```bash
pip install requests
```

### 3. Set Your API Key

**Option A: Environment Variable (Recommended)**
```bash
export GOOGLE_MAPS_API_KEY='your-api-key-here'
```

**Option B: Enter when prompted**
The script will ask for your API key if not found in environment

### 4. Run the Script

```bash
python google_maps_extractor.py
```

## Usage Examples

### Example 1: Basic Search
```
Enter search query: coffee shops in Vancouver
```

### Example 2: Healthcare (Your Use Case)
```
Enter search query: naturopathic clinics in Toronto
```

### Example 3: Competitor Research
```
Enter search query: digital marketing agencies in Kingston Ontario
```

### Example 4: Local SEO Research
```
Enter search query: dentists near Queen Street Toronto
```

## Output Data Fields

The CSV export includes these fields:

**NAP (Core Data):**
- business_name
- street_address
- city
- province_state
- postal_code
- country
- full_address
- phone
- international_phone

**Digital Presence:**
- website
- google_maps_url
- photo_url

**Reputation:**
- rating
- user_rating_count

**Operational Details:**
- hours (formatted as: "Monday: 9:00 AM – 5:00 PM | Tuesday: ...")
- business_status
- price_level

**Location:**
- latitude
- longitude
- place_id

**Categories:**
- categories (comma-separated types)

**Service Features:**
- delivery
- dine_in
- takeout
- reservable
- serves_breakfast/lunch/dinner
- serves_beer/wine
- wheelchair_accessible

## API Costs & Limits

**Pricing (as of 2024):**
- Text Search: $32 per 1,000 requests
- Place Details: $17 per 1,000 requests
- **Monthly free credit: $200**

**Example Cost Calculation:**
- Search for 20 results: 1 Text Search call = $0.032
- Get details for 20 places: 20 Place Details calls = $0.34
- **Total per search: ~$0.37**
- With $200 credit: ~540 searches/month free

**Rate Limits:**
- The script includes a 0.5-second delay between requests
- Adjust if needed: modify `delay` parameter in `batch_extract()`

## Advanced Usage

### Modify Search Parameters

Edit the `search_places()` method to add location bias:

```python
location_bias = {
    "circle": {
        "center": {
            "latitude": 43.6532,
            "longitude": -79.3832
        },
        "radius": 5000.0  # 5km radius
    }
}

place_ids = extractor.search_places(query, location_bias=location_bias)
```

### Batch Multiple Queries

```python
queries = [
    "naturopathic clinics in Toronto",
    "naturopathic clinics in Vancouver",
    "naturopathic clinics in Montreal"
]

for query in queries:
    businesses = extractor.batch_extract(query)
    filename = f"export_{query.replace(' ', '_')}.csv"
    extractor.export_to_csv(businesses, filename)
```

### Increase Results Per Query

Modify `maxResultCount` in `search_places()`:

```python
payload = {
    "textQuery": query,
    "maxResultCount": 20  # Max is 20 per request
}
```

To get more than 20 results, you'll need to implement pagination using `nextPageToken` from the API response.

## Integration Ideas for Your Marketing Workflows

### 1. Competitive Analysis
- Extract all competitors in a market
- Compare their ratings, reviews, and digital presence
- Identify gaps in coverage areas

### 2. Local SEO Audit
- Get NAP data for client locations
- Verify consistency across listings
- Monitor ratings and review counts

### 3. Lead Generation
- Find businesses without websites
- Identify poorly-rated competitors
- Export contact information for outreach

### 4. Market Research
- Analyze category distribution
- Map service area coverage
- Identify underserved locations

### 5. Client Reporting
- Track monthly rating changes
- Monitor review velocity
- Report on competitive landscape

## Automation with Google Sheets

Want to push this directly to Google Sheets? You can use the Google Sheets API:

```python
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build

# Add after extraction
def export_to_sheets(businesses, spreadsheet_id, sheet_name="Sheet1"):
    creds = Credentials.from_service_account_file('credentials.json')
    service = build('sheets', 'v4', credentials=creds)
    
    # Prepare data
    headers = list(businesses[0].keys())
    values = [headers]
    for business in businesses:
        values.append([business.get(h, '') for h in headers])
    
    # Update sheet
    body = {'values': values}
    service.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id,
        range=f"{sheet_name}!A1",
        valueInputOption='RAW',
        body=body
    ).execute()
```

## Troubleshooting

**Error: "Places API (New) has not been used in project"**
- Make sure you enabled "Places API (New)" not just "Places API"
- Wait a few minutes after enabling

**Error: "API key not valid"**
- Check that you copied the full API key
- Verify API restrictions allow Places API (New)

**No results returned:**
- Try a more specific query
- Add location context to your search
- Verify the location exists in Google Maps

**Rate limit errors:**
- Increase the `delay` parameter
- Reduce `maxResultCount`
- Spread requests over time

## Support Resources

- [Places API (New) Documentation](https://developers.google.com/maps/documentation/places/web-service/overview)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Field Mask Documentation](https://developers.google.com/maps/documentation/places/web-service/place-details#fields)

## Next Steps

Want to enhance this tool? Consider adding:
- Pagination for >20 results
- Photo downloads
- Review extraction
- Competitor comparison reports
- Automated scheduling (cron jobs)
- Google Sheets integration
- Airtable/CRM integration
- Email alerts for new listings
- Multi-language support
