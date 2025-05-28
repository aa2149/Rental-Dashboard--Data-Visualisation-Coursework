export async function renderUAEMap() {
  const container = document.getElementById("map-container");
  const width = container.offsetWidth;
  const height = 0.9 * window.innerHeight;

  const svg = d3
    .select("#map")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("width", width)
    .attr("height", height)
    .style("max-width", "100%")
    .style("height", "auto");

  const g = svg.append("g");

  const projection = d3
    .geoMercator()
    .center([54.5, 24.5])
    .scale(5000)
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "rgba(0,0,0,0.7)")
    .style("color", "white")
    .style("padding", "5px")
    .style("border-radius", "5px")
    .style("display", "none")
    .style("pointer-events", "none");

  // 🔁 Name corrections for GeoJSON-to-dataset mapping
  const nameCorrections = {
    Dubay: "Dubai",
    Fujayrah: "Fujairah",
    "Ras Al Khaymah": "Ras Al Khaimah",
    "Umm Al Qaywayn": "Umm Al Quwain",
    "Abu Zaby": "Abu Dhabi",
    "Ash Shariqah": "Sharjah",
    Ajman: "Ajman",
    "Al Ayn": "Al Ain",
    "Neutral Zone": null,
  };

  function getEmirateName(props) {
    const rawName = props?.NAME_1 ?? "Unknown";
    return nameCorrections[rawName] || rawName;
  }

  const jsonFiles = {
    "Abu Dhabi": "./Charts/city_splits/Abu_Dhabi_rent_data.json",
    Ajman: "./Charts/city_splits/Ajman_rent_data.json",
    "Al Ain": "./Charts/city_splits/Al_Ain_rent_data.json",
    Dubai: "./Charts/city_splits/Dubai_rent_data.json",
    Fujairah: "./Charts/city_splits/Fujairah_rent_data.json",
    "Ras Al Khaimah": "./Charts/city_splits/Ras_Al_Khaimah_rent_data.json",
    Sharjah: "./Charts/city_splits/Sharjah_rent_data.json",
    "Umm Al Quwain": "./Charts/city_splits/Umm_Al_Quwain_rent_data.json",
  };

  const mapData = await d3.json("./Charts/map2.geojson");
  const features = mapData?.features ?? [];

  let currentCity = null;

  // Draw map shapes
  g.selectAll("path")
    .data(features)
    .join("path")
    .attr("d", path)
    .attr("fill", "#6d4f3e")
    .attr("stroke", "black")
    .attr("stroke-width", 1)
    .attr("cursor", "pointer")
    .on("click", clicked)
    .append("title")
    .text((d) => getEmirateName(d.properties));

  // Emirate Labels
  const labelGroup = g.append("g").attr("class", "emirate-labels");

  labelGroup
    .selectAll(".emirate-label")
    .data(features)
    .join("text")
    .attr("class", "emirate-label")
    .attr("text-anchor", "middle")
    .style("fill", "white")
    .style("font-weight", "bold")
    .style("font-size", "8px")
    .style("pointer-events", "none")
    .attr("transform", (d) => {
      let [cx, cy] = path.centroid(d);
      if (!Number.isFinite(cx) || !Number.isFinite(cy)) {
        const fallback = d3.geoCentroid(d);
        [cx, cy] = projection(fallback);
      }
      return `translate(${cx},${cy})`;
    })
    .text((d) => getEmirateName(d.properties));

  const zoom = d3.zoom().scaleExtent([1, 8]).on("zoom", zoomed);
  svg.call(zoom);

  function zoomed(event) {
    g.attr("transform", event.transform);
    g.attr("stroke-width", 1 / event.transform.k);

    labelGroup
      .selectAll(".emirate-label")
      .style("opacity", event.transform.k < 4 ? 1 : 0);

    if (currentCity) {
      updateRentPoints(currentCity, event.transform);
    }
  }

  async function updateRentPoints(cityName, transform) {
    if (!jsonFiles[cityName]) return;

    const rentData = await d3.json(jsonFiles[cityName]);
    const rentMap = d3.rollup(
      rentData,
      (v) => d3.mean(v, (d) => d.Rent_per_sqft),
      (d) => `${d.Location}-${d.Latitude}-${d.Longitude}`
    );

    const combinedData = Array.from(rentMap, ([key, value]) => {
      const [location, lat, lon] = key.split("-");
      return {
        Location: location,
        Latitude: +lat,
        Longitude: +lon,
        Avg_Rent_per_sqft: value,
      };
    });

    g.selectAll(".rent-marker").remove();
    g.selectAll(".rent-label").remove();

    const markers = g
      .selectAll(".rent-marker")
      .data(combinedData)
      .join("g")
      .attr("class", "rent-marker")
      .attr(
        "transform",
        (d) => `translate(${projection([d.Longitude, d.Latitude])})`
      );

    markers
      .append("image")
      .attr("xlink:href", "./Charts/marker-icon.png")
      .attr("width", 5)
      .attr("height", 8)
      .attr("x", -2.5)
      .attr("y", -8)
      .on("mouseover", (event, d) => {
        tooltip
          .style("display", "block")
          .style("left", event.pageX + "px")
          .style("top", event.pageY - 20 + "px")
          .html(
            `<b>${d.Location}</b><br>Avg Rent: ${d.Avg_Rent_per_sqft.toFixed(
              2
            )} AED`
          );
      })
      .on("mouseout", () => tooltip.style("display", "none"));

    if (transform.k > 5) {
      const labels = g
        .selectAll(".rent-label")
        .data(combinedData)
        .join("text")
        .attr("class", "rent-label")
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .style("font-size", (d) => `${Math.max(8 / transform.k, 5)}px`)
        .style("pointer-events", "none")
        .text((d) => d.Location)
        .attr("transform", (d) => {
          const [px, py] = projection([d.Longitude, d.Latitude]);
          return `translate(${px}, ${py - 10})`;
        });

      const placed = [];
      labels.each(function () {
        const bbox = this.getBBox();
        for (let prev of placed) {
          const overlap = !(
            bbox.x + bbox.width < prev.x ||
            bbox.x > prev.x + prev.width ||
            bbox.y + bbox.height < prev.y ||
            bbox.y > prev.y + prev.height
          );
          if (overlap) {
            d3.select(this).remove();
            return;
          }
        }
        placed.push(bbox);
      });
    }
  }

  function clicked(event, d) {
    event.stopPropagation();

    const [[x0, y0], [x1, y1]] = path.bounds(d);
    const cityName = getEmirateName(d.properties);

    if (!cityName || !jsonFiles[cityName]) {
      console.warn("Clicked on invalid or unsupported region:", cityName);
      return;
    }

    console.log("Clicked on:", cityName);

    if (currentCity === cityName) {
      currentCity = null;
      g.selectAll("path").transition().style("fill", "#6d4f3e");
      labelGroup.selectAll(".emirate-label").style("opacity", 1);
      return;
    }

    currentCity = cityName;
    updateRentPoints(cityName, d3.zoomTransform(svg.node()));

    g.selectAll("path").transition().style("fill", "#6d4f3e");
    d3.select(event.target).transition().style("fill", "red");

    svg
      .transition()
      .duration(750)
      .call(
        zoom.transform,
        d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(
            Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height))
          )
          .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
      );
  }

  d3.select("#reset-map-btn").on("click", () => {
    currentCity = null;
    g.selectAll(".rent-marker").remove();
    g.selectAll(".rent-label").remove();
    g.selectAll("path").transition().style("fill", "#6d4f3e");
    labelGroup.selectAll(".emirate-label").style("opacity", 1);
    svg
      .transition()
      .duration(750)
      .call(d3.zoomIdentity.scale(1).translate(0, 0));
  });

  svg.on("click", () => {
    currentCity = null;
    g.selectAll(".rent-marker").remove();
    g.selectAll(".rent-label").remove();
    g.selectAll("path").transition().style("fill", "#6d4f3e");
    labelGroup.selectAll(".emirate-label").style("opacity", 1);
  });
}
