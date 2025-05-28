const svg = d3.select("svg"),
      margin = {top: 40, right: 20, bottom: 60, left: 80},
      width = +svg.attr("width") - margin.left - margin.right,
      height = +svg.attr("height") - margin.top - margin.bottom;

const chartArea = svg.append("g")
                     .attr("transform", `translate(${margin.left},${margin.top})`);

const x = d3.scaleBand().range([0, width]).padding(0.3);
const y = d3.scaleLinear().range([height, 0]);

const xAxisGroup = chartArea.append("g")
                             .attr("transform", `translate(0, ${height})`);

const yAxisGroup = chartArea.append("g");

let currentMetric = 'Annual Rent';

d3.csv("cleaned_dataset.csv").then(data => {
  data.forEach(d => {
    d["Annual Rent"] = +d["Annual Rent"];
    d["Rent per square feet"] = +d["Rent per square feet"];
  });

  updateChart(currentMetric);

  function updateChart(metric) {
    currentMetric = metric;

    document.querySelectorAll('.button').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.button[data-metric="${metric}"]`).classList.add('active');

    x.domain(data.map(d => d.City));
    y.domain([0, d3.max(data, d => d[metric])]);

    xAxisGroup.transition().duration(800).call(d3.axisBottom(x));
    yAxisGroup.transition().duration(800).call(d3.axisLeft(y));

    const bars = chartArea.selectAll(".bar").data(data, d => d.City);

    // ENTER
    bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.City))
        .attr("width", x.bandwidth())
        .attr("y", height)
        .attr("height", 0)
        .attr("fill", d => d.City === "Dubai" ? "#8de0bd" : d.City === "RAK" ? "#f2856d" : "#b0c4de")
        .transition()
        .duration(800)
        .attr("y", d => y(d[metric]))
        .attr("height", d => height - y(d[metric]));

    // UPDATE
    bars.transition()
        .duration(800)
        .attr("x", d => x(d.City))
        .attr("width", x.bandwidth())
        .attr("y", d => y(d[metric]))
        .attr("height", d => height - y(d[metric]))
        .attr("fill", d => d.City === "Dubai" ? "#8de0bd" : d.City === "RAK" ? "#f2856d" : "#b0c4de");

    // EXIT
    bars.exit().remove();
  }

  document.querySelectorAll('.button').forEach(btn => {
    btn.addEventListener('click', () => {
      const metric = btn.getAttribute('data-metric');
      updateChart(metric);
    });
  });
});
