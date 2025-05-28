export function renderCityBarChart(
  containerSelector,
  csvPath,
  defaultMetric = "Average Rent"
) {
  const svg = d3.select(containerSelector),
    margin = { top: 40, right: 20, bottom: 60, left: 100 },
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom;

  const chartArea = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand().range([0, width]).padding(0.3);
  const y = d3.scaleLinear().range([height, 0]);

  const xAxisGroup = chartArea
    .append("g")
    .attr("transform", `translate(0, ${height})`);
  const yAxisGroup = chartArea.append("g");

  let currentMetric = defaultMetric;
  let summarizedData;

  const metricMap = {
    "Average Rent": "Rent",
    "Average Rent per Sq Ft": "Rent_per_sqft",
  };

  d3.csv(csvPath).then((csv) => {
    // Group by city and calculate averages
    const grouped = d3.group(csv, (d) => d.City);

    summarizedData = Array.from(grouped, ([city, entries]) => {
      const avgRent = d3.mean(entries, (d) => +d.Rent);
      const avgPerSqft = d3.mean(entries, (d) => +d.Rent_per_sqft);
      return {
        City: city,
        "Average Rent": avgRent,
        "Average Rent per Sq Ft": avgPerSqft,
      };
    });

    updateChart(currentMetric);
  });

  function updateChart(metric) {
    currentMetric = metric;

    document
      .querySelectorAll(".button")
      .forEach((btn) =>
        btn.classList.toggle("active", btn.dataset.metric === metric)
      );

    x.domain(summarizedData.map((d) => d.City));
    y.domain([0, d3.max(summarizedData, (d) => d[metric])]);

    xAxisGroup.transition().duration(800).call(d3.axisBottom(x));
    yAxisGroup.transition().duration(800).call(d3.axisLeft(y));

    const bars = chartArea
      .selectAll(".bar")
      .data(summarizedData, (d) => d.City);

    const tooltip = d3.select("#tooltip"); // Add this near the top of your function

    // Inside updateChart()
    bars
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => x(d.City))
      .attr("width", x.bandwidth())
      .attr("y", height)
      .attr("height", 0)
      .attr("fill", "#fca311")
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 0.9)
          .html(
            `<strong>${d.City}</strong><br>${metric}: ${d[metric].toFixed(2)}`
          );
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      })
      .transition()
      .duration(800)
      .attr("y", (d) => y(d[metric]))
      .attr("height", (d) => height - y(d[metric]));

    bars
      .transition()
      .duration(800)
      .attr("x", (d) => x(d.City))
      .attr("width", x.bandwidth())
      .attr("y", (d) => y(d[metric]))
      .attr("height", (d) => height - y(d[metric]))
      .attr("fill", "#fca311");

    bars.exit().remove();
    // Bar chart metric toggle
    document.querySelectorAll(".button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const metric = btn.getAttribute("data-metric");
        if (window.setCityBarMetric) {
          window.setCityBarMetric(metric);
        }
      });
    });
  }

  // ✅ Expose to main.js
  window.setCityBarMetric = updateChart;
}
