function renderBubbleChart(data) {
  const margin = { top: 100, right: 80, bottom: 80, left: 80 };
  const width = 900;
  const height = 550;

  const svg = d3
    .select("#bubble-chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("width", "100%")
    .style("height", "auto");

  const chartGroup = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const cityRent = d3.rollup(
    data.filter((d) => d.city && d.Rent_per_sqft),
    (v) => d3.mean(v, (d) => d.Rent_per_sqft),
    (d) => d.city
  );

  const cityArea = d3.rollup(
    data.filter((d) => d.city && d.Area_in_sqft),
    (v) => d3.mean(v, (d) => d.Area_in_sqft),
    (d) => d.city
  );

  const values = Array.from(cityRent, ([city, avgRentPerSqft]) => ({
    city,
    avgRentPerSqft,
    avgArea: cityArea.get(city) ?? 0,
  })).filter((d) => d.avgArea > 0 && d.avgRentPerSqft > 0);

  // ✅ Add debug log if needed
  // console.log("Bubble data:", values);

  const x = d3
    .scaleLinear()
    .domain(d3.extent(values, (d) => d.avgArea))
    .nice()
    .range([0, innerWidth]);

  const y = d3
    .scaleLinear()
    .domain(d3.extent(values, (d) => d.avgRentPerSqft))
    .nice()
    .range([innerHeight, 0]);

  const size = d3
    .scaleSqrt()
    .domain(d3.extent(values, (d) => d.avgRentPerSqft))
    .range([45, 180]); // ⬅️ Increased both min and max

  const color = d3
    .scaleSequential()
    .domain(d3.extent(values, (d) => d.avgRentPerSqft))
    .interpolator(d3.interpolateYlOrRd);

  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "#333")
    .style("color", "#fff")
    .style("padding", "6px 10px")
    .style("font-size", "14px")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("display", "none");

  // ✅ Axes
  chartGroup
    .append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("fill", "white");

  chartGroup
    .append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
    .attr("fill", "white");

  chartGroup
    .append("text")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + 45)
    .attr("fill", "white")
    .style("text-anchor", "middle")
    .text("Average Area (sqft)");

  chartGroup
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight / 2)
    .attr("y", -40)
    .attr("fill", "white")
    .style("text-anchor", "middle")
    .text("Rent per sqft (AED)");

  // ✅ Bubbles
  chartGroup
    .selectAll("circle")
    .data(values)
    .join("circle")
    .attr("cx", (d) => x(d.avgArea))
    .attr("cy", (d) => y(d.avgRentPerSqft))
    .attr("r", 0)
    .style("fill", (d) => color(d.avgRentPerSqft))
    .style("opacity", 0.85)
    .on("mouseover", (event, d) => {
      tooltip
        .style("display", "block")
        .html(
          `<strong>${d.city}</strong><br>Rent/Sqft: ${d.avgRentPerSqft.toFixed(
            2
          )}<br>Avg Area: ${Math.round(d.avgArea)} sqft`
        )
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 30 + "px");
    })
    .on("mouseout", () => tooltip.style("display", "none"))
    .transition()
    .duration(800)
    .attr("r", (d) => size(d.avgRentPerSqft));

  // ✅ Bubble Labels
  chartGroup
    .selectAll(".bubble-label")
    .data(values)
    .join("text")
    .attr("class", "bubble-label")
    .attr("x", (d) => x(d.avgArea))
    .attr("y", (d) => y(d.avgRentPerSqft))
    .attr("dy", "0.35em")
    .attr("text-anchor", "middle")
    .attr("fill", "white")
    .attr("font-size", "12px")
    .text((d) => d.city);
}
