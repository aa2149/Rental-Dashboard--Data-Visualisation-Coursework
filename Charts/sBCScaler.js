export function renderSBCScaler() {
  const keys = ["Apartment", "Villa"];
  let cityDetails = {};
  let originalYMax;
  let y;

  const margin = { top: 30, right: 30, bottom: 50, left: 60 },
    width = 1000 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

  const svgOuter = d3
    .select("#barChart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  const chartGroup = svgOuter
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const tooltip = d3.select("#tooltip");

  d3.csv("Charts/cleaned_dataset.csv", d3.autoType).then((data) => {
    const barDataMap = d3.rollup(
      data,
      (v) => ({
        Apartment: v.filter((d) => d.Type === "Apartment").length,
        Villa: v.filter((d) => d.Type === "Villa").length,
      }),
      (d) => d.City
    );

    const stackedData = Array.from(barDataMap, ([city, counts]) => ({
      city,
      ...counts,
    }));

    originalYMax = d3.max(stackedData, (d) => d.Apartment + d.Villa);

    const detailsMap = d3.rollup(
      data,
      (v) => v.length,
      (d) => d.City,
      (d) => d.Type
    );
    detailsMap.forEach((innerMap, city) => {
      const details = Array.from(innerMap, ([type, count]) => ({
        type,
        count,
      }));
      cityDetails[city] = details;
    });

    drawStackedBarChart(stackedData);
  });

  function drawStackedBarChart(stackedData) {
    const x = d3
      .scaleBand()
      .domain(stackedData.map((d) => d.city))
      .range([0, width])
      .padding(0.1);

    y = d3.scaleLinear().domain([0, originalYMax]).range([height, 0]);

    const color = d3.scaleOrdinal().domain(keys).range(["#1f77b4", "#ff7f0e"]);
    const stackedSeries = d3.stack().keys(keys)(stackedData);

    chartGroup
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));
    chartGroup.append("g").attr("class", "y-axis").call(d3.axisLeft(y));

    chartGroup
      .selectAll("g.layer")
      .data(stackedSeries)
      .join("g")
      .attr("class", "layer")
      .attr("fill", (d) => color(d.key))
      .selectAll("rect")
      .data((d) => d)
      .join("rect")
      .attr("x", (d) => x(d.data.city))
      .attr("y", height)
      .attr("width", x.bandwidth())
      .attr("height", 0)
      .on("mouseover", (event, d) => {
        const currentKey = d3.select(event.currentTarget.parentNode).datum().key;
        const tooltipText = `${currentKey}: ${d.data[currentKey]}`;
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(tooltipText)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(500).style("opacity", 0);
      })
      .on("click", (event, d) => updatePieChart(d.data.city))
      .transition()
      .duration(800)
      .attr("y", (d) => y(d[1]))
      .attr("height", (d) => y(d[0]) - y(d[1]));

    d3.select("#yScaleSlider").on("input", function () {
      const factor = +this.value;
      d3.select("#scaleValue").text(factor.toFixed(1));
      y.domain([0, originalYMax / factor]);
      chartGroup.select(".y-axis").transition().duration(500).call(d3.axisLeft(y));
      chartGroup
        .selectAll("g.layer")
        .selectAll("rect")
        .transition()
        .duration(500)
        .attr("y", (d) => y(d[1]))
        .attr("height", (d) => y(d[0]) - y(d[1]));
    });
  }

  function updatePieChart(city) {
    const data = cityDetails[city];
    if (!data) return;

    d3.select("#pieChart").html(""); // Clear both SVG and legend

    const pieWidth = 450,
      pieHeight = 450,
      pieMargin = 30;
    const radius = Math.min(pieWidth, pieHeight) / 2 - pieMargin;

    // Create wrapper for pie + legend
    const pieWrapper = d3.select("#pieChart")
      .append("div")
      .attr("class", "pie-wrapper")
      .style("display", "flex")
      .style("align-items", "flex-start")
      .style("gap", "30px");

    const svgPie = pieWrapper
      .append("svg")
      .attr("width", pieWidth)
      .attr("height", pieHeight)
      .append("g")
      .attr("transform", `translate(${pieWidth / 2},${pieHeight / 2})`);

    const pieColor = d3
      .scaleOrdinal()
      .domain(data.map((d) => d.type))
      .range(d3.schemeCategory10);

    const pie = d3.pie().value((d) => d.count).sort(null);
    const data_ready = pie(data);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    svgPie
      .selectAll("path")
      .data(data_ready)
      .join("path")
      .attr("d", arc)
      .attr("fill", (d) => pieColor(d.data.type))
      .attr("stroke", "white")
      .style("stroke-width", "2px")
      .style("opacity", 0)
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(`${d.data.type}: ${d.data.count}`)
          .style("left", event.pageX + 5 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", () => {
        tooltip.transition().duration(500).style("opacity", 0);
      })
      .transition()
      .duration(800)
      .style("opacity", 1)
      .attrTween("d", function (d) {
        const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function (t) {
          return arc(i(t));
        };
      });

    // Legend
    const legend = pieWrapper
      .append("div")
      .attr("class", "legend-box")
      .style("margin-top", "20px");

    legend.selectAll("div")
      .data(data)
      .join("div")
      .style("display", "flex")
      .style("align-items", "center")
      .style("margin-bottom", "10px")
      .html(d => `
        <div style="width: 16px; height: 16px; background:${pieColor(d.type)}; margin-right: 8px; border-radius: 4px;"></div>
        <span style="color:white; font-size: 14px;">${d.type}</span>
      `);
  }
}
