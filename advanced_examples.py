"""
Advanced Google Maps Extractor Examples
Specialized scripts for marketing automation and analysis
"""

from google_maps_extractor import GoogleMapsExtractor
import os
import csv
from datetime import datetime
import json


# ============================================================================
# EXAMPLE 1: Multi-Location Competitive Analysis
# ============================================================================

def competitive_landscape_analysis(api_key, competitors, locations):
    """
    Extract data for specific competitors across multiple locations
    Great for competitive intelligence and market analysis
    """
    extractor = GoogleMapsExtractor(api_key)
    all_results = []

    for location in locations:
        for competitor in competitors:
            query = f"{competitor} in {location}"
            print(f"\n🔍 Searching: {query}")

            businesses = extractor.batch_extract(query, delay=0.5)

            # Add metadata
            for business in businesses:
                business['search_location'] = location
                business['search_competitor'] = competitor
                business['extracted_date'] = datetime.now().strftime("%Y-%m-%d")

            all_results.extend(businesses)

    # Export consolidated results
    if all_results:
        filename = f"competitive_analysis_{datetime.now().strftime('%Y%m%d')}.csv"
        extractor.export_to_csv(all_results, filename)

        # Generate summary report
        generate_competitive_summary(all_results)

    return all_results


def generate_competitive_summary(businesses):
    """Generate a summary report of competitive analysis"""

    print("\n" + "=" * 80)
    print("📊 COMPETITIVE ANALYSIS SUMMARY")
    print("=" * 80)

    # Group by location
    by_location = {}
    for business in businesses:
        loc = business['search_location']
        if loc not in by_location:
            by_location[loc] = []
        by_location[loc].append(business)

    for location, businesses_in_loc in by_location.items():
        print(f"\n📍 {location}")
        print(f"   Total Businesses Found: {len(businesses_in_loc)}")

        # Calculate average rating
        ratings = [float(b['rating']) for b in businesses_in_loc if b['rating']]
        avg_rating = sum(ratings) / len(ratings) if ratings else 0
        print(f"   Average Rating: {avg_rating:.2f}")

        # Count businesses with websites
        with_website = sum(1 for b in businesses_in_loc if b['website'])
        print(f"   Businesses with Website: {with_website}/{len(businesses_in_loc)} ({with_website/len(businesses_in_loc)*100:.1f}%)")

        # Show top rated
        sorted_businesses = sorted(businesses_in_loc, key=lambda x: float(x['rating'] or 0), reverse=True)
        if sorted_businesses:
            top = sorted_businesses[0]
            print(f"   Top Rated: {top['business_name']} ({top['rating']} ⭐)")


# ============================================================================
# EXAMPLE 2: Lead Generation - Find Businesses Without Websites
# ============================================================================

def find_lead_opportunities(api_key, query, min_rating=4.0):
    """
    Find highly-rated businesses without websites
    Perfect for service provider outreach
    """
    extractor = GoogleMapsExtractor(api_key)
    businesses = extractor.batch_extract(query)

    # Filter for leads: good rating but no website
    leads = []
    for business in businesses:
        rating = float(business['rating']) if business['rating'] else 0
        has_website = bool(business['website'])

        if rating >= min_rating and not has_website:
            leads.append(business)

    if leads:
        filename = f"lead_opportunities_{datetime.now().strftime('%Y%m%d')}.csv"
        extractor.export_to_csv(leads, filename)

        print(f"\n🎯 Found {len(leads)} lead opportunities!")
        print(f"   High-rated businesses without websites")
        print(f"   Exported to: {filename}")

        # Show top leads
        print("\n📋 Top Leads:")
        for i, lead in enumerate(leads[:5], 1):
            print(f"   {i}. {lead['business_name']}")
            print(f"      Rating: {lead['rating']} | Phone: {lead['phone']}")

    return leads


# ============================================================================
# EXAMPLE 3: NAP Consistency Audit for Client
# ============================================================================

def nap_consistency_audit(api_key, business_name, expected_locations):
    """
    Check NAP consistency across multiple locations
    Essential for multi-location businesses
    """
    extractor = GoogleMapsExtractor(api_key)

    print(f"\n🔍 NAP Consistency Audit for: {business_name}")
    print("=" * 80)

    all_listings = []

    for location in expected_locations:
        query = f"{business_name} {location}"
        businesses = extractor.batch_extract(query, delay=0.5)

        for business in businesses:
            business['expected_location'] = location

        all_listings.extend(businesses)

    # Check for inconsistencies
    inconsistencies = analyze_nap_consistency(all_listings)

    # Export full audit
    filename = f"nap_audit_{business_name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.csv"
    extractor.export_to_csv(all_listings, filename)

    return all_listings, inconsistencies


def analyze_nap_consistency(listings):
    """Analyze NAP data for consistency issues"""

    print("\n📊 NAP Consistency Analysis")
    print("-" * 80)

    inconsistencies = []

    # Check phone number variations
    phone_numbers = set(l['phone'] for l in listings if l['phone'])
    if len(phone_numbers) > 1:
        issue = f"⚠️  Multiple phone numbers found: {phone_numbers}"
        print(issue)
        inconsistencies.append(issue)

    # Check business name variations
    names = set(l['business_name'] for l in listings)
    if len(names) > 1:
        issue = f"⚠️  Name inconsistencies: {names}"
        print(issue)
        inconsistencies.append(issue)

    # Check for missing websites
    missing_website = [l for l in listings if not l['website']]
    if missing_website:
        issue = f"⚠️  {len(missing_website)} location(s) missing website"
        print(issue)
        inconsistencies.append(issue)

    if not inconsistencies:
        print("✅ No major inconsistencies found!")

    return inconsistencies


# ============================================================================
# EXAMPLE 4: Market Density Analysis
# ============================================================================

def market_density_analysis(api_key, business_type, cities):
    """
    Analyze market saturation across different cities
    Useful for expansion planning
    """
    extractor = GoogleMapsExtractor(api_key)

    print(f"\n📊 Market Density Analysis: {business_type}")
    print("=" * 80)

    results = {}

    for city in cities:
        query = f"{business_type} in {city}"
        businesses = extractor.batch_extract(query, delay=0.5)

        results[city] = {
            'count': len(businesses),
            'avg_rating': calculate_average_rating(businesses),
            'businesses': businesses
        }

    # Display summary
    print("\n📈 Market Density Summary:")
    print(f"{'City':<20} {'Count':<10} {'Avg Rating':<12}")
    print("-" * 45)

    for city, data in sorted(results.items(), key=lambda x: x[1]['count'], reverse=True):
        print(f"{city:<20} {data['count']:<10} {data['avg_rating']:<12.2f}")

    # Export detailed data
    all_businesses = []
    for city, data in results.items():
        for business in data['businesses']:
            business['analysis_city'] = city
            business['market_density'] = data['count']
            all_businesses.append(business)

    filename = f"market_density_{business_type.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.csv"
    extractor.export_to_csv(all_businesses, filename)

    return results


def calculate_average_rating(businesses):
    """Calculate average rating from business list"""
    ratings = [float(b['rating']) for b in businesses if b['rating']]
    return sum(ratings) / len(ratings) if ratings else 0.0


# ============================================================================
# EXAMPLE 5: Automated Monthly Monitoring
# ============================================================================

def monthly_monitoring_report(api_key, client_queries):
    """
    Generate monthly monitoring report for multiple clients
    Perfect for recurring reporting
    """
    extractor = GoogleMapsExtractor(api_key)

    timestamp = datetime.now().strftime("%Y-%m")
    report_data = {}

    for client_name, query in client_queries.items():
        print(f"\n📊 Processing: {client_name}")
        businesses = extractor.batch_extract(query, delay=0.5)

        # Store monthly snapshot
        report_data[client_name] = {
            'query': query,
            'timestamp': timestamp,
            'total_results': len(businesses),
            'avg_rating': calculate_average_rating(businesses),
            'businesses': businesses
        }

        # Export individual client report
        filename = f"{client_name.replace(' ', '_')}_monthly_{timestamp}.csv"
        extractor.export_to_csv(businesses, filename)

    # Generate summary JSON for tracking
    summary_file = f"monthly_summary_{timestamp}.json"
    with open(summary_file, 'w') as f:
        summary = {
            client: {
                'total_results': data['total_results'],
                'avg_rating': data['avg_rating'],
                'query': data['query']
            }
            for client, data in report_data.items()
        }
        json.dump(summary, f, indent=2)

    print(f"\n✅ Monthly monitoring complete!")
    print(f"   Summary saved to: {summary_file}")

    return report_data


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")

    if not api_key:
        print("Please set GOOGLE_MAPS_API_KEY environment variable")
        exit(1)

    print("\n" + "=" * 80)
    print("🚀 ADVANCED GOOGLE MAPS EXTRACTOR - EXAMPLES")
    print("=" * 80)

    # Uncomment the example you want to run:

    # Example 1: Competitive Analysis
    # competitive_landscape_analysis(
    #     api_key,
    #     competitors=["Advanced Women's Health", "Naturopathic Clinic"],
    #     locations=["Toronto", "Vancouver", "Kingston Ontario"]
    # )

    # Example 2: Lead Generation
    # find_lead_opportunities(
    #     api_key,
    #     query="dental clinics in Toronto",
    #     min_rating=4.5
    # )

    # Example 3: NAP Audit
    # nap_consistency_audit(
    #     api_key,
    #     business_name="Advanced Women's Health",
    #     expected_locations=["Toronto", "Vancouver", "Kingston"]
    # )

    # Example 4: Market Density
    # market_density_analysis(
    #     api_key,
    #     business_type="naturopathic clinics",
    #     cities=["Toronto", "Vancouver", "Calgary", "Montreal", "Ottawa"]
    # )

    # Example 5: Monthly Monitoring
    # client_queries = {
    #     "Advanced Women's Health": "Advanced Women's Health Ontario",
    #     "Competitor A": "naturopathic clinic Toronto",
    #     "Competitor B": "holistic health Vancouver"
    # }
    # monthly_monitoring_report(api_key, client_queries)

    print("\n💡 Uncomment an example above to run it!")
    print("   Edit the parameters to match your specific use case.\n")
