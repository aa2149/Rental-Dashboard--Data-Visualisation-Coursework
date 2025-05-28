// ButterflyChart.js

const margin = { top: 40, right: 40, bottom: 40, left: 250 };
const width = 900 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;
const legendColors = ["steelblue", "orange"];

const labelMap = {
  Rent: "Rent (AED)",
  Beds: "Beds",
  Baths: "Baths",
  Area_in_sqft: "Area (sqft)",
  Rent_per_sqft: "Rent per sqft (AED)",
  Age_of_listing_in_days: "Age of listing (days)",
};

function formatValue(val) {
  if (val >= 1000000) return d3.format(".2s")(val);
  if (val >= 1000) return d3.format(",")(val);
  return val.toFixed(0);
}

export function renderButterflyChart(
  svgContainer,
  data,
  cityArray,
  selectedAttributes
) {
  svgContainer.selectAll("*").remove();

  if (cityArray.length !== 2 || selectedAttributes.length === 0) {
    svgContainer
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
    const xScale = d3
      .scaleLinear()
      .domain([0, maxVal || 1])
      .range([0, width / 2]);

    svgContainer
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

    svgContainer
      .append("rect")
      .attr("x", width / 2)
      .attr("y", yScale(attr))
      .attr("height", yScale.bandwidth())
      .attr("width", 0)
      .attr("fill", legendColors[1])
      .transition()
      .duration(800)
      .attr("width", xScale(val2));

    svgContainer
      .append("text")
      .attr("x", width / 2)
      .attr("y", yScale(attr) + yScale.bandwidth() / 2)
      .attr("dy", "0.35em")
      .style("text-anchor", "middle")
      .style("fill", "white")
      .style("font-size", "14px")
      .text(labelMap[attr]);

    if (val1 > 0) {
      svgContainer
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

    if (val2 > 0) {
      svgContainer
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

export const butterflyChartConfig = {
  margin,
  width,
  height,
  legendColors,
  labelMap,
};
