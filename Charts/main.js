import { renderUAEMap } from "./UAEMap.js";
import {
  renderButterflyChart,
  butterflyChartConfig,
} from "./ButterflyChart.js";
import { setupParallax } from "./parallax.js";
import { renderCityBarChart } from "./CityBarChart.js";
import { renderSBCScaler } from "./sBCScaler.js";

// Initial Setup
setupParallax();
renderUAEMap();
renderSBCScaler();
renderCityBarChart("#city-bar-svg", "Charts/cleaned_dataset.csv");
//main script:
renderRentPredictionModel("Charts/cleaned_dataset.csv");

const allCities = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Umm Al Quwain", "Fujairah", "Al Ain", "Ras Al Khaimah"];
const allAttributes = Object.keys(butterflyChartConfig.labelMap);
let selectedCities = new Set(["Dubai", "Abu Dhabi"]);
let dataset;

// Butterfly Chart SVG setup
const svg = d3
  .select("#chart-container")
  .append("svg")
  .attr(
    "width",
    butterflyChartConfig.width +
      butterflyChartConfig.margin.left +
      butterflyChartConfig.margin.right
  )
  .attr(
    "height",
    butterflyChartConfig.height +
      butterflyChartConfig.margin.top +
      butterflyChartConfig.margin.bottom
  )
  .append("g")
  .attr(
    "transform",
    `translate(${butterflyChartConfig.margin.left},${butterflyChartConfig.margin.top})`
  );

// Load and prepare data
d3.csv("Charts/cleaned_dataset.csv").then((raw) => {
  dataset = raw.map((d) => ({
    ...d,
    city: d.City,
    Rent: +d.Rent,
    Beds: +d.Beds,
    Baths: +d.Baths,
    Area_in_sqft: +d.Area_in_sqft,
    Rent_per_sqft: +d.Rent_per_sqft,
    Age_of_listing_in_days: +d.Age_of_listing_in_days,
  }));

  setupUI();
  renderBubbleChart(dataset);
});

// UI setup
function setupUI() {
  const citySelector = document.getElementById("city-selector");
  citySelector.innerHTML = "";

  allCities.forEach((city) => {
    const pill = document.createElement("div");
    pill.classList.add("city-pill");
    pill.textContent = city;
    if (selectedCities.has(city)) pill.classList.add("selected");

    pill.addEventListener("click", () => {
      if (selectedCities.has(city)) {
        selectedCities.delete(city);
        pill.classList.remove("selected");
      } else if (selectedCities.size < 2) {
        selectedCities.add(city);
        pill.classList.add("selected");
      }
      updateChart();
    });

    citySelector.appendChild(pill);
  });

  document.getElementById("reset-cities-btn").addEventListener("click", () => {
    selectedCities = new Set(["Dubai", "Abu Dhabi"]);
    document.querySelectorAll(".city-pill").forEach((pill) => {
      pill.classList.toggle("selected", selectedCities.has(pill.textContent));
    });
    updateChart();
  });

  const attrContainer = d3.select("#attr-selector");
  attrContainer.html("");
  allAttributes.forEach((attr) => {
    attrContainer
      .append("label")
      .html(
        `<input type='checkbox' value='${attr}' checked> ${butterflyChartConfig.labelMap[attr]}`
      );
  });

  d3.selectAll("#attr-selector input").on("change", updateChart);
  updateChart();
}

// Update Butterfly Chart
function updateChart() {
  const selectedAttr = Array.from(
    document.querySelectorAll("#attr-selector input:checked")
  ).map((d) => d.value);

  const legendContainer = document.getElementById("city-legend");
  legendContainer.innerHTML = "";
  Array.from(selectedCities).forEach((city, i) => {
    const entry = document.createElement("div");
    entry.classList.add("city-legend-entry");
    entry.innerHTML = `<span class="city-legend-box" style="background-color: ${butterflyChartConfig.legendColors[i]}"></span>${city}`;
    legendContainer.appendChild(entry);
  });

  renderButterflyChart(svg, dataset, Array.from(selectedCities), selectedAttr);
}

// Bubble Chart: Affordability Visual
function renderBubbleChart(data) {
  const margin = { top: 60, right: 80, bottom: 80, left: 80 };
  const width = 960;
  const height = 500;

  const svg = d3
    .select("#bubble-chart-container")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const chart = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const cityAvg = Array.from(
    d3.group(data, (d) => d.city),
    ([city, values]) => ({
      city,
      avgRentPerSqft: d3.mean(values, (d) => d.Rent_per_sqft),
      avgArea: d3.mean(values, (d) => d.Area_in_sqft),
    })
  );

  const x = d3
    .scaleLinear()
    .domain(d3.extent(cityAvg, (d) => d.avgArea))
    .nice()
    .range([0, innerWidth]);

  const y = d3
    .scaleLinear()
    .domain(d3.extent(cityAvg, (d) => d.avgRentPerSqft))
    .nice()
    .range([innerHeight, 0]);

  const radius = d3
    .scaleSqrt()
    .domain(d3.extent(cityAvg, (d) => d.avgRentPerSqft))
    .range([30, 100]);

  const color = d3
    .scaleSequential()
    .domain(d3.extent(cityAvg, (d) => d.avgRentPerSqft))
    .interpolator(d3.interpolateYlOrRd);

  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "#333")
    .style("color", "#fff")
    .style("padding", "6px 12px")
    .style("border-radius", "4px")
    .style("display", "none");

  // Axes
  chart
    .append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).ticks(5))
    .selectAll("text")
    .attr("fill", "white");

  chart
    .append("g")
    .call(d3.axisLeft(y).ticks(5))
    .selectAll("text")
    .attr("fill", "white");

  // Axis labels
  svg
    .append("text")
    .attr("x", margin.left + innerWidth / 2)
    .attr("y", height - 20)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .attr("font-size", "14px")
    .text("Average Area (sqft)");

  svg
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .attr("font-size", "14px")
    .text("Average Rent per sqft (AED)");

  // Bubbles
  chart
    .selectAll("circle")
    .data(cityAvg)
    .join("circle")
    .attr("cx", (d) => x(d.avgArea))
    .attr("cy", (d) => y(d.avgRentPerSqft))
    .attr("r", 0)
    .style("fill", (d) => color(d.avgRentPerSqft))
    .style("opacity", 0.8)
    .on("mouseover", (event, d) => {
      tooltip
        .style("display", "block")
        .html(
          `<strong>${d.city}</strong><br>Rent/Sqft: ${d.avgRentPerSqft.toFixed(
            2
          )} AED<br>Avg Area: ${Math.round(d.avgArea)} sqft`
        )
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 30 + "px");
    })
    .on("mouseout", () => tooltip.style("display", "none"))
    .transition()
    .duration(1000)
    .attr("r", (d) => radius(d.avgRentPerSqft));

  // Bubble labels
  chart
    .selectAll("text.label")
    .data(cityAvg)
    .join("text")
    .attr("x", (d) => x(d.avgArea))
    .attr("y", (d) => y(d.avgRentPerSqft))
    .attr("text-anchor", "middle")
    .attr("dy", ".35em")
    .text((d) => d.city)
    .attr("fill", "white")
    .style("font-weight", "bold")
    .style("pointer-events", "none")
    .style("font-size", "12px");
}

import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

function renderRentPredictionModel(filePath) {
  const margin = { top: 40, right: 200, bottom: 50, left: 70 };
  const svg = d3.select("#rent-vs-area-chart");
  const width = +svg.attr("width");
  const height = +svg.attr("height");
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "#000")
    .style("color", "#fff")
    .style("padding", "8px")
    .style("border-radius", "5px")
    .style("pointer-events", "none")
    .style("display", "none");

  d3.csv(filePath).then((rawData) => {
    rawData.forEach((d) => {
      d.Area = +d.Area_in_sqft;
      d.Rent = +d.Rent;
    });

    const data = rawData.filter((d) => d.Area > 0 && d.Rent > 0);
    const cities = Array.from(new Set(data.map((d) => d.City)));
    const color = d3.scaleOrdinal(d3.schemeTableau10).domain(cities);

    const maxRent = d3.max(data, (d) => d.Rent);
    const maxArea = d3.max(data, (d) => d.Area);

    const modelCoefficients = Object.fromEntries(
      cities.map((city) => {
        const cityData = data.filter((d) => d.City === city);
        const [slope, intercept] = linearRegression(
          cityData.map((d) => Math.log(d.Area)),
          cityData.map((d) => Math.log(d.Rent))
        );
        return [city, [slope, intercept]];
      })
    );

    function predictRent(city, area) {
      const [slope, intercept] = modelCoefficients[city] || [0, 0];
      return Math.exp(slope * Math.log(area) + intercept);
    }

    function updateChart(minArea) {
      svg.selectAll("g").remove();

      const g = svg
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3.scaleLog().domain([minArea, maxArea]).range([0, innerWidth]);

      const y = d3
        .scaleLog()
        .domain([
          Math.max(
            100,
            d3.min(data, (d) => d.Rent)
          ),
          maxRent,
        ])
        .range([innerHeight, 0]);

      g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).ticks(10, "~s"));

      g.append("g").call(d3.axisLeft(y).ticks(10, "~s"));

      g.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 40)
        .attr("text-anchor", "middle")
        .style("fill", "white")
        .text("Area (sqft)");

      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .style("fill", "white")
        .text("Rent (AED)");

      const filtered = data.filter((d) => d.Area >= minArea);

      g.selectAll("circle")
        .data(filtered)
        .join("circle")
        .attr("cx", (d) => x(d.Area))
        .attr("cy", (d) => y(d.Rent))
        .attr("r", 3)
        .attr("fill", (d) => color(d.City))
        .attr("opacity", 0.6)
        .on("mouseover", (event, d) => {
          const predicted = predictRent(d.City, d.Area).toFixed(2);
          tooltip
            .style("display", "block")
            .html(
              `<strong>${d.City}</strong><br>Actual: ${d.Rent} AED<br>Predicted: ${predicted} AED`
            )
            .style("left", event.pageX + 10 + "px")
            .style("top", event.pageY - 30 + "px");
        })
        .on("mouseout", () => tooltip.style("display", "none"));

      cities.forEach((city) => {
        const cityData = filtered.filter((d) => d.City === city);
        const [slope, intercept] = modelCoefficients[city];

        const line = d3
          .line()
          .x((d) => x(d))
          .y((d) => y(Math.exp(slope * Math.log(d) + intercept)));

        const lineData = d3.range(minArea, maxArea, 20);

        g.append("path")
          .datum(lineData)
          .attr("fill", "none")
          .attr("stroke", color(city))
          .attr("stroke-width", 2)
          .attr("d", line);
      });

      // Legend
      const legend = svg
        .append("g")
        .attr(
          "transform",
          `translate(${width - margin.right + 20}, ${margin.top})`
        );

      cities.forEach((city, i) => {
        const row = legend
          .append("g")
          .attr("transform", `translate(0, ${i * 20})`);
        row
          .append("rect")
          .attr("width", 12)
          .attr("height", 12)
          .attr("fill", color(city));
        row
          .append("text")
          .attr("x", 18)
          .attr("y", 10)
          .attr("fill", "white")
          .text(city)
          .style("font-size", "12px");
      });
    }

    function linearRegression(xVals, yVals) {
      const xMean = d3.mean(xVals);
      const yMean = d3.mean(yVals);
      const num = d3.sum(xVals.map((x, i) => (x - xMean) * (yVals[i] - yMean)));
      const den = d3.sum(xVals.map((x) => (x - xMean) ** 2));
      const slope = num / den;
      const intercept = yMean - slope * xMean;
      return [slope, intercept];
    }

    const xSlider = document.getElementById("xMinSlider");
    const xValueText = document.getElementById("xMinValue");
    updateChart(+xSlider.value);

    xSlider.addEventListener("input", () => {
      const val = Math.max(10, +xSlider.value);
      xValueText.textContent = val;
      updateChart(val);
    });
  });
}
