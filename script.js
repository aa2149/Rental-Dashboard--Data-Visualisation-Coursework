// 🌌 Parallax effect
let burjkhalifa = document.getElementById("burjkhalifa");
let stars = document.getElementById("stars");



window.addEventListener("scroll", () => {
  let value = window.scrollY;

  logo.style.left = value * -2 + "px";
  burjkhalifa.style.top = value * 1 + "px";
  stars.style.top = value * 1 + "px";
});

// 📊 Chart Setup
const csvFile = "cleaned_dataset.csv";

const labelMap = {
  Rent: "Rent (AED)",
  Beds: "Beds",
  Baths: "Baths",
  Area_in_sqft: "Area (sqft)",
  Rent_per_sqft: "Rent per sqft (AED)",
  Age_of_listing_in_days: "Age of listing (days)",
};

const allCities = ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "UAQ"];
const allAttributes = Object.keys(labelMap);
const legendColors = ["steelblue", "orange"];

// 🛠 Increased left margin to avoid label cutoff
const margin = { top: 40, right: 40, bottom: 40, left: 250 };
const width = 900 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3
  .select("#chart-container")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .style("background-color", "#1b1b2f")
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

let data;
let selectedCities = new Set(["Dubai", "Abu Dhabi"]);

d3.csv(csvFile).then((raw) => {
  data = raw.map((d) => ({
    ...d,
    city: d.City,
    Rent: +d.Rent,
    Beds: +d.Beds,
    Baths: +d.Baths,
    Area_in_sqft: +d.Area_in_sqft,
    Rent_per_sqft: +d.Rent_per_sqft,
    Age_of_listing_in_days: +d.Age_of_listing_in_days,
  }));

  createControls();
});

// 📦 Format large values cleanly
function formatValue(val) {
  if (val >= 1000000) return d3.format(".2s")(val); // e.g. 1.2M
  if (val >= 1000) return d3.format(",")(val);      // e.g. 12,450
  return val.toFixed(0);
}

function createControls() {
  const citySelector = document.getElementById("city-selector");
  citySelector.innerHTML = `<p style="color:white; font-weight:bold;">Select 2 Cities:</p>`;

  allCities.forEach((city) => {
    const pill = document.createElement("div");
    pill.classList.add("city-pill");
    pill.textContent = city;
    if (selectedCities.has(city)) pill.classList.add("selected");

    pill.addEventListener("click", () => {
      if (selectedCities.has(city)) {
        selectedCities.delete(city);
        pill.classList.remove("selected");
      } else {
        if (selectedCities.size < 2) {
          selectedCities.add(city);
          pill.classList.add("selected");
        }
      }
      updateChart(Array.from(selectedCities));
    });

    citySelector.appendChild(pill);
  });

  // 🔁 Reset button
  document.getElementById("reset-cities-btn").addEventListener("click", () => {
    selectedCities = new Set(["Dubai", "Abu Dhabi"]);
    document.querySelectorAll(".city-pill").forEach((pill) => {
      if (selectedCities.has(pill.textContent)) {
        pill.classList.add("selected");
      } else {
        pill.classList.remove("selected");
      }
    });
    updateChart(Array.from(selectedCities));
  });

  // ✅ Attributes
  const attrContainer = d3.select("#attr-selector");
  attrContainer.html("");
  allAttributes.forEach((attr) => {
    attrContainer
      .append("label")
      .style("margin-right", "10px")
      .style("color", "white")
      .html(`<input type='checkbox' value='${attr}' checked> ${labelMap[attr]}`);
  });

  d3.selectAll("#attr-selector input").on("change", () => {
    updateChart(Array.from(selectedCities));
  });

  updateChart(Array.from(selectedCities)); // First render
}

function updateChart(cityArray) {
  svg.selectAll("*").remove();

  const selectedAttributes = Array.from(
    document.querySelectorAll("#attr-selector input:checked")
  ).map((d) => d.value);

  // 🟦🟧 Legend Update
  const legendContainer = document.getElementById("city-legend");
  legendContainer.innerHTML = "";
  cityArray.forEach((city, i) => {
    const entry = document.createElement("div");
    entry.classList.add("city-legend-entry");
    entry.innerHTML = `
      <span class="city-legend-box" style="background-color: ${legendColors[i]}"></span>
      ${city}
    `;
    legendContainer.appendChild(entry);
  });

  if (cityArray.length !== 2 || selectedAttributes.length === 0) {
    svg
      .append("text")
      .text("Select exactly 2 cities and at least 1 attribute.")
      .attr("x", 0)
      .attr("y", 40)
      .style("fill", "white");
    return;
  }

  const avgStats = d3.rollups(
    data.filter((d) => cityArray.includes(d.city)),
    (v) =>
      Object.fromEntries(
        selectedAttributes.map((attr) => [attr, d3.mean(v, (d) => d[attr])])
      ),
    (d) => d.city
  );

  const restructured = selectedAttributes.map((attr) => {
    const row = { attribute: attr };
    avgStats.forEach(([city, values]) => {
      row[city] = values[attr];
    });
    return row;
  });

  const yScale = d3
    .scaleBand()
    .domain(selectedAttributes)
    .range([0, height])
    .padding(0.2);

  restructured.forEach((d) => {
    const attr = d.attribute;
    const val1 = d[cityArray[0]] || 0;
    const val2 = d[cityArray[1]] || 0;
    const maxVal = Math.max(val1, val2);
    const xScale = d3.scaleLinear().domain([0, maxVal || 1]).range([0, width / 2]);

    // Left Bar (with animation)
    svg
      .append("rect")
      .attr("x", width / 2)
      .attr("y", yScale(attr))
      .attr("height", yScale.bandwidth())
      .attr("width", 0)
      .attr("fill", legendColors[0])
      .transition()
      .duration(800)
      .attr("x", width / 2 - xScale(val1))
      .attr("width", xScale(val1));

    // Right Bar
    svg
      .append("rect")
      .attr("x", width / 2)
      .attr("y", yScale(attr))
      .attr("height", yScale.bandwidth())
      .attr("width", 0)
      .attr("fill", legendColors[1])
      .transition()
      .duration(800)
      .attr("width", xScale(val2));

    // Center label
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", yScale(attr) + yScale.bandwidth() / 2)
      .attr("dy", "0.35em")
      .style("text-anchor", "middle")
      .style("fill", "white")
      .style("font-size", "14px")
      .text(labelMap[attr]);

    // Left value label (clamped)
    if (val1 > 0) {
      svg
        .append("text")
        .attr("x", Math.max(width / 2 - xScale(val1) - 10, -5))
        .attr("y", yScale(attr) + yScale.bandwidth() / 2)
        .attr("dy", "0.35em")
        .style("text-anchor", "end")
        .style("fill", "white")
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .text(formatValue(val1));
    }

    // Right value label
    if (val2 > 0) {
      svg
        .append("text")
        .attr("x", width / 2 + xScale(val2) + 5)
        .attr("y", yScale(attr) + yScale.bandwidth() / 2)
        .attr("dy", "0.35em")
        .style("text-anchor", "start")
        .style("fill", "white")
        .style("font-size", "11px")
        .style("font-weight", "bold")
        .text(formatValue(val2));
    }
  });
}
