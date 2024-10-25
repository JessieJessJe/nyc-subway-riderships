# A Rainy Day in New York

How did a single day of record rainfall bring one of the world's busiest transit systems to its knees?

https://mta-riderships.vercel.app/

This ambient visualization provides an animated view of NYC MTA hourly ridership changes from September 28 to October 1, 2023, highlighting the effects of record rainfall and flooding.

## Snapshots of The Odyssey

These two images from the visualization highlight ridership during rush hour at different stages of the event: one before the rainfall and the other after the flooding peak at 1 p.m. Explore the stark differences and see how a day of heavy rain reshaped the usual flow of commuters.

![Image 1](assets/image1.png) <!-- Replace with the actual image file name -->
![Image 2](assets/image2.png) <!-- Replace with the actual image

## Data Source

The data used in this project is sourced from the Metropolitan Transportation Authority (MTA) and includes subway ridership statistics from September 28 to 30, 2023.
https://data.ny.gov/Transportation/MTA-Subway-Hourly-Ridership-Beginning-July-2020/wujg-7c2s/about_data

## Author

This project was created by Jessie Han, a UX designer and data visualization enthusiast, with a passion for using data to uncover stories and insights about urban life.

## Process

Data Collection: Subway ridership data was collected from the MTA's public dataset

```python
import pandas as pd
import json
from collections import defaultdict
from datetime import datetime

# Load the raw data from CSV
file_path = '/content/MTA Subway Hourly Ridership September 2023.csv'  # Adjust path to your local file
df = pd.read_csv(file_path)

# Aggregate ridership by station, day, and hour
aggregated_data = defaultdict(lambda: {
    'total_ridership': 0,
    'station_complex': '',
    'latitude': None,
    'longitude': None,
    'borough': '',
    'transit_day': '',
    'transit_hour': ''
})

# Iterate through rows and aggregate data
for _, row in df.iterrows():
    station_id = row['station_complex_id']
    timestamp = row['transit_timestamp']

  # Update to match the format of your timestamp
    dt = datetime.strptime(timestamp, "%m/%d/%Y %I:%M:%S %p")
    transit_day = dt.strftime("%Y-%m-%d")
    transit_hour = dt.strftime("%H:00")

    key = (station_id, transit_day, transit_hour)

    ridership = float(row['ridership']) if pd.notna(row['ridership']) else 0

    aggregated_data[key]['total_ridership'] += ridership
    aggregated_data[key]['station_complex'] = row['station_complex']
    aggregated_data[key]['latitude'] = float(row['latitude'])
    aggregated_data[key]['longitude'] = float(row['longitude'])
    aggregated_data[key]['borough'] = row['borough']
    aggregated_data[key]['transit_day'] = transit_day
    aggregated_data[key]['transit_hour'] = transit_hour

# Convert aggregated data to a list of dictionaries
aggregated_list = [
    {
        'station_complex_id': key[0],
        'transit_day': info['transit_day'],
        'transit_hour': info['transit_hour'],
        'station_complex': info['station_complex'],
        'total_ridership': info['total_ridership'],
        'latitude': info['latitude'],
        'longitude': info['longitude'],
        'borough': info['borough']
    }
    for key, info in aggregated_data.items()
]

# Save to JSON file
output_path = 'MTA_ridership_data_aggregated.json'  # Adjust path as needed
with open(output_path, 'w') as f:
    json.dump(aggregated_list, f, indent=4)

print(f"Aggregated data saved to {output_path}")

```

Visualization: Using tools like React and WebGL, the data was visualized to highlight the differences in subway ridership before, during, and after the intense rainfall. The focus was on comparing rush hour traffic on September 28 and September 30 to the disruptions caused by the flooding on September 29.
