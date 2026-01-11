from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from ..middleware.auth import get_current_user
from ..models.auth import TokenData
from ..models.base_term import (
    BaseTerm,
    NewBaseTerm,
    BaseTermsResponse,
    BulkGenerateRequest,
    BulkGenerateResponse,
)
from ..models.query import QueueStatus
from ..services.firebase_service import FirebaseService

router = APIRouter(prefix="/base-terms", tags=["base-terms"])


# Location data - matches frontend/src/data/locations.ts
# This is a simplified version - the frontend has the full data
LOCATIONS = {
    "CA": {
        "name": "Canada",
        "provinces": {
            "ON": ["Toronto", "Ottawa", "Mississauga", "Brampton", "Hamilton", "London", "Markham", "Vaughan", "Kitchener", "Windsor", "Richmond Hill", "Oakville", "Burlington", "Oshawa", "Greater Sudbury", "Barrie", "St. Catharines", "Cambridge", "Kingston", "Guelph"],
            "QC": ["Montreal", "Quebec City", "Laval", "Gatineau", "Longueuil", "Sherbrooke", "Saguenay", "Levis", "Trois-Rivieres", "Terrebonne", "Saint-Jean-sur-Richelieu", "Brossard", "Repentigny", "Drummondville", "Saint-Jerome", "Granby", "Blainville", "Saint-Hyacinthe", "Shawinigan", "Dollard-des-Ormeaux"],
            "BC": ["Vancouver", "Surrey", "Burnaby", "Richmond", "Abbotsford", "Coquitlam", "Kelowna", "Saanich", "Delta", "Langley Township", "Kamloops", "Nanaimo", "Victoria", "Chilliwack", "Maple Ridge", "Prince George", "New Westminster", "Port Coquitlam", "North Vancouver City", "Vernon"],
            "AB": ["Calgary", "Edmonton", "Red Deer", "Lethbridge", "St. Albert", "Medicine Hat", "Grande Prairie", "Airdrie", "Spruce Grove", "Leduc", "Fort Saskatchewan", "Cochrane", "Lloydminster", "Camrose", "Brooks", "Chestermere", "Cold Lake", "Okotoks", "Wetaskiwin", "Lacombe"],
            "MB": ["Winnipeg", "Brandon", "Steinbach", "Thompson", "Portage la Prairie", "Winkler", "Selkirk", "Morden", "Dauphin", "The Pas", "Flin Flon", "Stonewall", "Neepawa", "Niverville", "Swan River", "Virden", "Altona", "Carman", "Gimli", "Beausejour"],
            "SK": ["Saskatoon", "Regina", "Prince Albert", "Moose Jaw", "Swift Current", "Yorkton", "North Battleford", "Estevan", "Warman", "Martensville", "Weyburn", "Lloydminster", "Melfort", "Humboldt", "Meadow Lake", "Kindersley", "Tisdale", "Melville", "La Ronge", "Nipawin"],
            "NS": ["Halifax", "Cape Breton", "Truro", "Amherst", "New Glasgow", "Bridgewater", "Yarmouth", "Kentville", "Antigonish", "Wolfville", "Stellarton", "Pictou", "Westville", "Port Hawkesbury", "Lunenburg", "Middleton", "Windsor", "Digby", "Shelburne", "Liverpool"],
            "NB": ["Moncton", "Saint John", "Fredericton", "Dieppe", "Riverview", "Miramichi", "Edmundston", "Bathurst", "Quispamsis", "Rothesay", "Campbellton", "Oromocto", "Shediac", "Grand Falls", "Woodstock", "Sussex", "Tracadie", "Caraquet", "Dalhousie", "Sackville"],
            "NL": ["St. John's", "Mount Pearl", "Corner Brook", "Conception Bay South", "Paradise", "Grand Falls-Windsor", "Gander", "Happy Valley-Goose Bay", "Labrador City", "Stephenville", "Torbay", "Portugal Cove-St. Philip's", "Clarenville", "Bay Roberts", "Carbonear", "Deer Lake", "Marystown", "Bonavista", "Lewisporte", "Channel-Port aux Basques"],
            "PE": ["Charlottetown", "Summerside", "Stratford", "Cornwall", "Montague", "Kensington", "Souris", "Alberton", "Georgetown", "Tignish", "O'Leary", "Borden-Carleton", "Murray Harbour", "Victoria", "Crapaud", "Hunter River", "North Rustico", "St. Peters Bay", "Morell", "Tyne Valley"],
            "YT": ["Whitehorse", "Dawson City", "Watson Lake", "Haines Junction", "Carmacks", "Mayo", "Faro", "Teslin", "Ross River", "Pelly Crossing"],
            "NT": ["Yellowknife", "Hay River", "Inuvik", "Fort Smith", "Behchoko", "Fort Simpson", "Norman Wells", "Fort Providence", "Tuktoyaktuk", "Fort McPherson"],
            "NU": ["Iqaluit", "Rankin Inlet", "Arviat", "Baker Lake", "Cambridge Bay", "Igloolik", "Pond Inlet", "Pangnirtung", "Cape Dorset", "Gjoa Haven"],
        },
    },
    "US": {
        "name": "United States",
        "provinces": {
            "AL": ["Birmingham", "Montgomery", "Huntsville", "Mobile", "Tuscaloosa", "Hoover", "Dothan", "Auburn", "Decatur", "Madison", "Florence", "Gadsden", "Vestavia Hills", "Prattville", "Phenix City", "Alabaster", "Bessemer", "Enterprise", "Opelika", "Homewood"],
            "AK": ["Anchorage", "Fairbanks", "Juneau", "Sitka", "Ketchikan", "Wasilla", "Kenai", "Kodiak", "Bethel", "Palmer", "Homer", "Unalaska", "Barrow", "Soldotna", "Valdez", "Nome", "Kotzebue", "Seward", "Cordova", "Dillingham"],
            "AZ": ["Phoenix", "Tucson", "Mesa", "Chandler", "Gilbert", "Glendale", "Scottsdale", "Peoria", "Tempe", "Surprise", "Yuma", "Avondale", "Goodyear", "Flagstaff", "Buckeye", "Lake Havasu City", "Casa Grande", "Maricopa", "Sierra Vista", "Prescott"],
            "AR": ["Little Rock", "Fort Smith", "Fayetteville", "Springdale", "Jonesboro", "North Little Rock", "Conway", "Rogers", "Bentonville", "Pine Bluff", "Hot Springs", "Benton", "Texarkana", "Sherwood", "Jacksonville", "Russellville", "Bella Vista", "West Memphis", "Paragould", "Cabot"],
            "CA": ["Los Angeles", "San Diego", "San Jose", "San Francisco", "Fresno", "Sacramento", "Long Beach", "Oakland", "Bakersfield", "Anaheim", "Santa Ana", "Riverside", "Stockton", "Irvine", "Chula Vista", "Fremont", "San Bernardino", "Modesto", "Fontana", "Moreno Valley"],
            "CO": ["Denver", "Colorado Springs", "Aurora", "Fort Collins", "Lakewood", "Thornton", "Arvada", "Westminster", "Pueblo", "Centennial", "Boulder", "Greeley", "Longmont", "Loveland", "Grand Junction", "Broomfield", "Castle Rock", "Commerce City", "Parker", "Littleton"],
            "CT": ["Bridgeport", "New Haven", "Stamford", "Hartford", "Waterbury", "Norwalk", "Danbury", "New Britain", "Bristol", "Meriden", "West Haven", "Milford", "Middletown", "Norwich", "Shelton", "Torrington", "New London", "Ansonia", "Derby", "Groton"],
            "DE": ["Wilmington", "Dover", "Newark", "Middletown", "Bear", "Brookside", "Glasgow", "Hockessin", "Smyrna", "Milford", "Claymont", "Seaford", "Georgetown", "Elsmere", "New Castle"],
            "FL": ["Jacksonville", "Miami", "Tampa", "Orlando", "St. Petersburg", "Hialeah", "Port St. Lucie", "Cape Coral", "Tallahassee", "Fort Lauderdale", "Pembroke Pines", "Hollywood", "Gainesville", "Miramar", "Coral Springs", "Palm Bay", "Lakeland", "West Palm Beach", "Pompano Beach", "Davie"],
            "GA": ["Atlanta", "Augusta", "Columbus", "Macon", "Savannah", "Athens", "Sandy Springs", "South Fulton", "Roswell", "Johns Creek", "Warner Robins", "Albany", "Alpharetta", "Marietta", "Stonecrest", "Smyrna", "Valdosta", "Brookhaven", "Dunwoody", "Peachtree Corners"],
            "HI": ["Honolulu", "East Honolulu", "Pearl City", "Hilo", "Kailua", "Waipahu", "Kaneohe", "Mililani Town", "Kahului", "Ewa Gentry", "Kihei", "Makakilo", "Kapolei", "Ewa Beach", "Aiea"],
            "ID": ["Boise", "Meridian", "Nampa", "Idaho Falls", "Caldwell", "Pocatello", "Coeur d'Alene", "Twin Falls", "Post Falls", "Lewiston", "Rexburg", "Eagle", "Kuna", "Moscow", "Mountain Home", "Ammon", "Chubbuck", "Hayden", "Jerome", "Blackfoot"],
            "IL": ["Chicago", "Aurora", "Joliet", "Naperville", "Rockford", "Elgin", "Springfield", "Peoria", "Champaign", "Waukegan", "Cicero", "Bloomington", "Arlington Heights", "Evanston", "Decatur", "Schaumburg", "Bolingbrook", "Palatine", "Skokie", "Des Plaines"],
            "IN": ["Indianapolis", "Fort Wayne", "Evansville", "South Bend", "Carmel", "Fishers", "Bloomington", "Hammond", "Gary", "Lafayette", "Muncie", "Terre Haute", "Noblesville", "Kokomo", "Anderson", "Greenwood", "Elkhart", "Mishawaka", "Lawrence", "Jeffersonville"],
            "IA": ["Des Moines", "Cedar Rapids", "Davenport", "Sioux City", "Iowa City", "Ankeny", "West Des Moines", "Ames", "Waterloo", "Council Bluffs", "Dubuque", "Urbandale", "Cedar Falls", "Marion", "Bettendorf", "Mason City", "Marshalltown", "Clinton", "Burlington", "Ottumwa"],
            "KS": ["Wichita", "Overland Park", "Kansas City", "Olathe", "Topeka", "Lawrence", "Shawnee", "Lenexa", "Manhattan", "Salina", "Hutchinson", "Leavenworth", "Leawood", "Dodge City", "Garden City", "Emporia", "Derby", "Junction City", "Prairie Village", "Gardner"],
            "KY": ["Louisville", "Lexington", "Bowling Green", "Owensboro", "Covington", "Richmond", "Georgetown", "Florence", "Nicholasville", "Elizabethtown", "Henderson", "Hopkinsville", "Jeffersontown", "Frankfort", "Independence", "Paducah", "Radcliff", "Ashland", "Madisonville", "Murray"],
            "LA": ["New Orleans", "Baton Rouge", "Shreveport", "Metairie", "Lafayette", "Lake Charles", "Bossier City", "Kenner", "Monroe", "Alexandria", "Houma", "Marrero", "New Iberia", "Laplace", "Slidell", "Central", "Prairieville", "Ruston", "Terrytown", "Sulphur"],
            "ME": ["Portland", "Lewiston", "Bangor", "South Portland", "Auburn", "Biddeford", "Sanford", "Brunswick", "Saco", "Westbrook", "Augusta", "Waterville", "Scarborough", "Windham", "Gorham"],
            "MD": ["Baltimore", "Columbia", "Germantown", "Silver Spring", "Waldorf", "Frederick", "Ellicott City", "Glen Burnie", "Gaithersburg", "Rockville", "Bethesda", "Dundalk", "Towson", "Bowie", "Aspen Hill", "Wheaton", "Severn", "North Bethesda", "Potomac", "Odenton"],
            "MA": ["Boston", "Worcester", "Springfield", "Cambridge", "Lowell", "Brockton", "New Bedford", "Quincy", "Lynn", "Fall River", "Newton", "Lawrence", "Somerville", "Framingham", "Haverhill", "Waltham", "Malden", "Brookline", "Plymouth", "Medford"],
            "MI": ["Detroit", "Grand Rapids", "Warren", "Sterling Heights", "Ann Arbor", "Lansing", "Flint", "Dearborn", "Livonia", "Troy", "Clinton Township", "Westland", "Farmington Hills", "Kalamazoo", "Wyoming", "Southfield", "Rochester Hills", "Taylor", "Pontiac", "St. Clair Shores"],
            "MN": ["Minneapolis", "St. Paul", "Rochester", "Bloomington", "Duluth", "Brooklyn Park", "Plymouth", "Woodbury", "Lakeville", "Maple Grove", "Blaine", "St. Cloud", "Eagan", "Burnsville", "Eden Prairie", "Coon Rapids", "Apple Valley", "Edina", "Minnetonka", "St. Louis Park"],
            "MS": ["Jackson", "Gulfport", "Southaven", "Biloxi", "Hattiesburg", "Olive Branch", "Tupelo", "Meridian", "Greenville", "Horn Lake", "Pearl", "Madison", "Clinton", "Starkville", "Oxford", "Brandon", "Vicksburg", "Pascagoula", "Columbus", "Ocean Springs"],
            "MO": ["Kansas City", "St. Louis", "Springfield", "Columbia", "Independence", "Lee's Summit", "O'Fallon", "St. Joseph", "St. Charles", "St. Peters", "Blue Springs", "Florissant", "Joplin", "Chesterfield", "Jefferson City", "Cape Girardeau", "Wildwood", "University City", "Ballwin", "Raytown"],
            "MT": ["Billings", "Missoula", "Great Falls", "Bozeman", "Butte", "Helena", "Kalispell", "Havre", "Anaconda", "Miles City", "Belgrade", "Livingston", "Laurel", "Whitefish", "Lewistown", "Sidney", "Glendive", "Columbia Falls", "Polson", "Dillon"],
            "NE": ["Omaha", "Lincoln", "Bellevue", "Grand Island", "Kearney", "Fremont", "Hastings", "Norfolk", "North Platte", "Papillion", "Columbus", "La Vista", "Scottsbluff", "South Sioux City", "Beatrice", "Lexington", "Alliance", "Blair", "York", "McCook"],
            "NV": ["Las Vegas", "Henderson", "Reno", "North Las Vegas", "Enterprise", "Spring Valley", "Sunrise Manor", "Paradise", "Sparks", "Carson City", "Whitney", "Pahrump", "Winchester", "Summerlin South", "Fernley", "Sun Valley", "Elko", "Mesquite", "Boulder City", "Gardnerville Ranchos"],
            "NH": ["Manchester", "Nashua", "Concord", "Derry", "Rochester", "Salem", "Dover", "Merrimack", "Londonderry", "Hudson", "Bedford", "Keene", "Portsmouth", "Goffstown", "Laconia", "Hampton", "Milford", "Durham", "Exeter", "Windham"],
            "NJ": ["Newark", "Jersey City", "Paterson", "Elizabeth", "Lakewood", "Edison", "Woodbridge", "Toms River", "Hamilton", "Trenton", "Clifton", "Camden", "Brick", "Cherry Hill", "Passaic", "Middletown", "Union City", "Old Bridge", "Gloucester Township", "East Orange"],
            "NM": ["Albuquerque", "Las Cruces", "Rio Rancho", "Santa Fe", "Roswell", "Farmington", "Clovis", "Hobbs", "Alamogordo", "Carlsbad", "Gallup", "Deming", "Los Lunas", "Sunland Park", "Las Vegas", "Portales", "Artesia", "Lovington", "Silver City", "Espanola"],
            "NY": ["New York City", "Buffalo", "Rochester", "Yonkers", "Syracuse", "Albany", "New Rochelle", "Mount Vernon", "Schenectady", "Utica", "White Plains", "Hempstead", "Troy", "Niagara Falls", "Binghamton", "Freeport", "Valley Stream", "Long Beach", "Spring Valley", "Rome"],
            "NC": ["Charlotte", "Raleigh", "Greensboro", "Durham", "Winston-Salem", "Fayetteville", "Cary", "Wilmington", "High Point", "Concord", "Asheville", "Greenville", "Gastonia", "Jacksonville", "Chapel Hill", "Huntersville", "Apex", "Wake Forest", "Kannapolis", "Indian Trail"],
            "ND": ["Fargo", "Bismarck", "Grand Forks", "Minot", "West Fargo", "Williston", "Dickinson", "Mandan", "Jamestown", "Wahpeton", "Devils Lake", "Watford City", "Valley City", "Grafton", "Beulah"],
            "OH": ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton", "Parma", "Canton", "Youngstown", "Lorain", "Hamilton", "Springfield", "Kettering", "Elyria", "Lakewood", "Cuyahoga Falls", "Middletown", "Euclid", "Newark", "Mentor"],
            "OK": ["Oklahoma City", "Tulsa", "Norman", "Broken Arrow", "Edmond", "Lawton", "Moore", "Midwest City", "Enid", "Stillwater", "Muskogee", "Bartlesville", "Owasso", "Shawnee", "Ponca City", "Ardmore", "Bixby", "Duncan", "Del City", "Yukon"],
            "OR": ["Portland", "Salem", "Eugene", "Gresham", "Hillsboro", "Bend", "Beaverton", "Medford", "Springfield", "Corvallis", "Albany", "Tigard", "Lake Oswego", "Keizer", "Grants Pass", "Oregon City", "McMinnville", "Redmond", "Tualatin", "West Linn"],
            "PA": ["Philadelphia", "Pittsburgh", "Allentown", "Reading", "Scranton", "Bethlehem", "Lancaster", "Harrisburg", "Altoona", "Erie", "York", "Wilkes-Barre", "Chester", "Williamsport", "Easton", "Lebanon", "Hazleton", "New Castle", "Johnstown", "McKeesport"],
            "RI": ["Providence", "Cranston", "Warwick", "Pawtucket", "East Providence", "Woonsocket", "Coventry", "Cumberland", "North Providence", "South Kingstown", "West Warwick", "Johnston", "North Kingstown", "Newport", "Bristol", "Westerly", "Central Falls", "Smithfield", "Lincoln", "Portsmouth"],
            "SC": ["Charleston", "Columbia", "North Charleston", "Mount Pleasant", "Rock Hill", "Greenville", "Summerville", "Goose Creek", "Sumter", "Hilton Head Island", "Florence", "Spartanburg", "Myrtle Beach", "Aiken", "Anderson", "Mauldin", "Greer", "Greenwood", "North Augusta", "Easley"],
            "SD": ["Sioux Falls", "Rapid City", "Aberdeen", "Brookings", "Watertown", "Mitchell", "Yankton", "Pierre", "Huron", "Spearfish", "Vermillion", "Box Elder", "Brandon", "Sturgis", "Madison"],
            "TN": ["Nashville", "Memphis", "Knoxville", "Chattanooga", "Clarksville", "Murfreesboro", "Franklin", "Jackson", "Johnson City", "Bartlett", "Hendersonville", "Kingsport", "Collierville", "Smyrna", "Cleveland", "Brentwood", "Germantown", "Columbia", "La Vergne", "Spring Hill"],
            "TX": ["Houston", "San Antonio", "Dallas", "Austin", "Fort Worth", "El Paso", "Arlington", "Corpus Christi", "Plano", "Lubbock", "Laredo", "Irving", "Garland", "Frisco", "McKinney", "Amarillo", "Grand Prairie", "Brownsville", "Killeen", "Pasadena"],
            "UT": ["Salt Lake City", "West Valley City", "West Jordan", "Provo", "Orem", "Sandy", "St. George", "Ogden", "Layton", "South Jordan", "Lehi", "Millcreek", "Taylorsville", "Logan", "Murray", "Draper", "Bountiful", "Riverton", "Herriman", "Spanish Fork"],
            "VT": ["Burlington", "South Burlington", "Rutland", "Barre", "Montpelier", "Winooski", "St. Albans", "Newport", "Vergennes", "St. Johnsbury"],
            "VA": ["Virginia Beach", "Norfolk", "Chesapeake", "Richmond", "Newport News", "Alexandria", "Hampton", "Roanoke", "Portsmouth", "Suffolk", "Lynchburg", "Harrisonburg", "Leesburg", "Charlottesville", "Blacksburg", "Danville", "Manassas", "Petersburg", "Fredericksburg", "Winchester"],
            "WA": ["Seattle", "Spokane", "Tacoma", "Vancouver", "Bellevue", "Kent", "Everett", "Renton", "Spokane Valley", "Federal Way", "Yakima", "Kirkland", "Bellingham", "Kennewick", "Auburn", "Pasco", "Marysville", "Lakewood", "Redmond", "Shoreline"],
            "WV": ["Charleston", "Huntington", "Morgantown", "Parkersburg", "Wheeling", "Weirton", "Fairmont", "Martinsburg", "Beckley", "Clarksburg", "South Charleston", "Teays Valley", "St. Albans", "Vienna", "Bluefield"],
            "WI": ["Milwaukee", "Madison", "Green Bay", "Kenosha", "Racine", "Appleton", "Waukesha", "Eau Claire", "Oshkosh", "Janesville", "West Allis", "La Crosse", "Sheboygan", "Wauwatosa", "Fond du Lac", "New Berlin", "Wausau", "Brookfield", "Greenfield", "Beloit"],
            "WY": ["Cheyenne", "Casper", "Laramie", "Gillette", "Rock Springs", "Sheridan", "Green River", "Evanston", "Riverton", "Jackson", "Cody", "Rawlins", "Lander", "Torrington", "Douglas"],
            "DC": ["Washington"],
        },
    },
}


def get_firebase_service():
    return FirebaseService()


def expand_locations(
    countries: List[str], provinces: List[str], cities: List[str]
) -> List[dict]:
    """Expand location selections into a list of city/province/country dicts."""
    result = []

    # Determine which countries to process
    target_countries = []
    if "ALL" in countries:
        target_countries = list(LOCATIONS.keys())
    else:
        target_countries = [c for c in countries if c in LOCATIONS]

    for country_code in target_countries:
        country_data = LOCATIONS[country_code]
        country_name = country_data["name"]

        # Determine which provinces to process
        target_provinces = []
        if "ALL" in provinces:
            target_provinces = list(country_data["provinces"].keys())
        else:
            target_provinces = [p for p in provinces if p in country_data["provinces"]]

        for province_code in target_provinces:
            province_cities = country_data["provinces"][province_code]

            # Determine which cities to process
            target_cities = []
            if "ALL" in cities:
                target_cities = province_cities
            else:
                target_cities = [c for c in cities if c in province_cities]

            for city in target_cities:
                result.append({
                    "city": city,
                    "province": province_code,
                    "country": country_code,
                })

    return result


@router.get("", response_model=BaseTermsResponse)
async def list_base_terms(
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
):
    """List all base terms for the current user."""
    terms = firebase.get_base_terms(user_id=current_user.uid)
    return BaseTermsResponse(
        baseTerms=[BaseTerm(**t) for t in terms],
        total=len(terms),
    )


@router.get("/queue-status", response_model=QueueStatus)
async def get_queue_status(
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
):
    """Get queue status counts for all queries."""
    status = firebase.get_queue_status(user_id=current_user.uid)
    return QueueStatus(**status)


@router.get("/{term_id}", response_model=BaseTerm)
async def get_base_term(
    term_id: str,
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
):
    """Get a single base term by ID."""
    term = firebase.get_base_term(term_id)
    if not term:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Base term not found",
        )
    if term.get("userId") != current_user.uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    return BaseTerm(**term)


@router.post("", response_model=BaseTerm)
async def create_base_term(
    new_term: NewBaseTerm,
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
):
    """Create a new base term."""
    try:
        term = firebase.create_base_term(
            user_id=current_user.uid,
            term=new_term.term,
            category=new_term.category,
        )
        return BaseTerm(**term)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete("/{term_id}")
async def delete_base_term(
    term_id: str,
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
):
    """Delete a base term and all its associated queries."""
    term = firebase.get_base_term(term_id)
    if not term:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Base term not found",
        )
    if term.get("userId") != current_user.uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )
    firebase.delete_base_term(term_id)
    return {"success": True}


@router.post("/{term_id}/generate", response_model=BulkGenerateResponse)
async def generate_queries(
    term_id: str,
    request: BulkGenerateRequest,
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
):
    """Bulk generate local queries for a base term."""
    # Verify base term ownership
    term = firebase.get_base_term(term_id)
    if not term:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Base term not found",
        )
    if term.get("userId") != current_user.uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    # Expand location selections
    locations = expand_locations(
        request.countries,
        request.provinces,
        request.cities,
    )

    if not locations:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid locations found for the given selection",
        )

    # Bulk create queries
    result = firebase.bulk_create_queries(
        user_id=current_user.uid,
        base_term_id=term_id,
        base_term=term["term"],
        locations=locations,
    )

    return BulkGenerateResponse(
        created=result["created"],
        skipped=result["skipped"],
        total=result["total"],
        message=f"Created {result['created']} queries, skipped {result['skipped']} duplicates",
    )


@router.post("/{term_id}/refresh-stats")
async def refresh_base_term_stats(
    term_id: str,
    current_user: TokenData = Depends(get_current_user),
    firebase: FirebaseService = Depends(get_firebase_service),
):
    """Recalculate and update stats for a base term."""
    term = firebase.get_base_term(term_id)
    if not term:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Base term not found",
        )
    if term.get("userId") != current_user.uid:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied",
        )

    stats = firebase.update_base_term_stats(term_id)
    return {"success": True, "stats": stats}
