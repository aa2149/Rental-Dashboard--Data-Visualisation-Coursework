UAE - Interactive D3 Visualization 

This interactive data visualization project helps answer a key question:
**"Where can you afford to rent in the UAE?"**

Built with D3.js, the dashboard walks users through a scrollable storytelling experience that blends:
- Geospatial rent distribution
- Statistical breakdowns
- Predictive modeling

--

## Table of Contents
- [Project Structure](#project-structure)
- [Charts & Visualizations](#charts--visualizations)
- [Dataset](#dataset)
- [Index HTML & CSS](#index-html--css)
- [Running the Project](#running-the-project)

## Project Structure

```
.
├── index.html                  # Layout structure for parallax and sections
├── style.css                   # Design system and responsive layout
├── main.js                     # Entry point importing and rendering all D3 modules
│
├── Charts/
│   ├── UAEMap.js               # Interactive map with zoom and district data
│   ├── CityBarChart.js         # Bar chart comparing average rent vs rent/sqft
│   ├── ButterflyChart.js       # Attribute comparison for two cities
│   ├── sBCScaler.js            # Property type stacked bar chart + pie view
│   ├── RentPredictionChart.js  # Log-log regression model with tooltip
│   ├── city_splits/            # Individual city rent data for pins
│   └── cleaned_dataset.csv     # Unified dataset used across all visuals
│
├── Assets/
│   └── marker-icon.png         # Custom pin used in the map
│
└── README.md                   # Project overview and documentation
---

 Charts & Visualizations

 1. Rent Across Emirates (Bar Chart)
- Visualizes average **total rent** and **rent per square foot**
- Toggle buttons let users switch metrics
- Implemented via `CityBarChart.js`

 2. Butterfly Chart (City Comparison)
- Lets users pick exactly **2 cities** to compare metrics like:
  - Rent, Area, Beds, Baths, Rent/Sqft, Listing Age
- Toggle attributes using checkboxes
- Built in `ButterflyChart.js`

 3. Property Type Distribution (Stacked Chart + Pie)
- Each city shows a breakdown of what types of properties dominate
- A **slider** controls vertical scaling
- Interactivity supported in `sBCScaler.js`

 4. Affordability Bubble Chart
- Bubbles show **rent value per sqft vs space**
- Larger bubble = higher cost
- Reveals affordability tradeoffs in cities
- Data aggregated in `main.js`

 5. Interactive UAE Map
- Clickable emirates load **district-level markers**
- Pins show average rent/sqft per area
- Zoomable with reset button
- Built in `UAEMap.js`

 6. Rent Prediction Scatter Plot
- Scatterplot of **actual rent vs area** (log-log scale)
- Tooltip shows predicted vs actual
- Slider controls minimum area
- Built in `RentPredictionChart.js`

---

 Dataset

 cleaned_dataset.csv
- Parsed and numeric-formatted dataset for all charts
- Fields:
  - `City`, `Area_in_sqft`, `Rent`, `Beds`, `Baths`, `Rent_per_sqft`, `Age_of_listing_in_days`

 city_splits/
- Each JSON file contains geo-coordinates and rent per sqft for a district
- Used for map pin overlays

---

 Index HTML & CSS

 index.html
- Houses all `<section>` blocks:
  - Parallax intro
  - Explanatory text
  - Chart containers with buttons, sliders, and legends
- Makes the experience feel like scrolling through a narrative report

 style.css
- Global styling: font, layout, dark theme
- Responsive elements (pills, sliders, map container)
- Parallax effect with layered PNGs

---

 Running the Project

1. Clone this repository  
2. Use **Live Server** in VS Code or run a local server:
   ```bash
   npx serve .
   ```
3. Open `index.html` in your browser
4. Scroll to explore the interactive visualizations

> No build process needed — D3 is imported from CDN and all modules use native ES modules.

---

## Summary

This project uses modular D3.js to power a rich, scroll-based storytelling tool. It helps users make informed rental decisions by revealing patterns, comparisons, and predictions about rent across the UAE's diverse emirates.
