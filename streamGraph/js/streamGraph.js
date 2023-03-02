function streamGraph(data) {
  // Convert numeric data
  var metrics = d3.keys(data[0]);
  metrics.splice(metrics.indexOf("Year"), 1);
  metrics.splice(metrics.indexOf("State"), 1);
  metrics.splice(metrics.indexOf("Firm_Age"), 1);

  data.forEach(function(d) {
    metrics.forEach(function(metric) {
      d[metric] = stringToNumber(d[metric]);
    });
  });

  // Format data
  var nest = d3.nest()
      .key(function(d) { return d.Year; }).sortKeys(d3.ascending)
      .key(function(d) { return d.State; }).sortKeys(d3.ascending)
      .key(function(d) { return d.Firm_Age; })
      .rollup(function(d) { return d[0]; })
      .object(data);

  var years = d3.keys(nest),
      states = d3.keys(nest[years[0]]);

  data = d3.keys(nest).map(function(d) {
    return nest[d];
  });

  // Set up GUI
  var firmAges = d3.keys(data[0][states[0]]);

  var firmAge = firmAges[0],
      metric = metrics[0];

  d3.select("#firmAgeSelect")
    .on("change", function(d) {
      firmAge = this.value;
      drawStreamgraph(firmAge, metric);
    })
    .selectAll("option")
      .data(firmAges)
    .enter().append("option")
      .attr("value", function(d) { return d; })
      .text(function(d) { return d; });

  d3.select("#metricSelect")
    .on("change", function(d) {
      metric = this.value;
      drawStreamgraph(firmAge, metric);
    })
    .selectAll("option")
      .data(metrics)
    .enter().append("option")
      .attr("value", function(d) { return d; })
      .text(function(d) { return d; });

  drawStreamgraph(firmAge, metric);

  function drawStreamgraph(firmAge, metric) {
    // Draw visualization
    var stack = d3.stack()
        .keys(states)
        .value(function(d, key) {
          return d[key][firmAge][metric];
        })
        .order(d3.stackOrderInsideOut)
        .offset(d3.stackOffsetWiggle);

    var stackData = stack(data);

    var svg = d3.select("#streamGraph");

    var svgWidth = parseInt(svg.style("width")),
        svgHeight = parseInt(svg.style("height")),
        margin = { top: 0, right: 0, bottom: 40, left: 80 }
        width = svgWidth - margin.left - margin.right,
        height = svgHeight - margin.top - margin.bottom;

    var g = svg.select("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var x = d3.scaleTime()
        //.domain(d3.extent(years))
        .domain([new Date(d3.min(years)), new Date(d3.max(years))])
        .range([0, width]);

    var y = d3.scaleLinear()
        .domain([d3.min(stackData, function(d) { return d3.min(d, function(d) { return d[0]; }); }),
                 d3.max(stackData, function(d) { return d3.max(d, function(d) { return d[1]; }); })])
        .range([height, 0]);

//    var color = d3.scaleLinear()
//        .range(["#aad", "#556"]);
    var color = d3.scaleOrdinal()
        .domain([0, 1])
        .range(["#9ebcda", "#556"]);

    var area = d3.area()
        .x(function(d, i) { return x(new Date(years[i])); })
        .y0(function(d) { return y(d[0]); })
        .y1(function(d) { return y(d[1]); })
        .curve(d3.curveMonotoneX);

    var path = g.selectAll("path")
        .data(stackData, function(d) { return d; });

    var pathEnter = path.enter().append("path");

    pathEnter
        .attr("d", area)
        .attr("data-toggle", "tooltip")
        //.style("fill", function() { return color(Math.random()); })
        .style("fill", function(d) { return color(d.index % 2); })
        .style("fill-opacity", 0)
        .style("stroke-width", 2)
        .on("mouseover", function(d) {
          g.selectAll("path").style("fill-opacity", 0.5);
          d3.select(this).style("fill-opacity", 1);
          d3.select(this).style("stroke", "black");
        })
        .on("mouseout", function(d) {
          d3.selectAll("path").style("fill-opacity", 1);
          d3.select(this).style("stroke", "none");
        });

    pathEnter.merge(path)
        .attr("title", function(d) {
          var extent = d3.extent(d, function(e) {
            return e.data[d.key][firmAge][metric];
          });

          return d.key + " : [ " +
                 extent[0].toLocaleString("en") + " - " +
                 extent[1].toLocaleString("en") + " ]";
        })
      .transition()
        .attr("d", area)
        .style("fill-opacity", 1);

    path.exit().transition()
        .style("fill-opacity", 0)
        .remove();

    // Axes
    var xAxis = d3.axisBottom(x)
        .tickFormat(d3.timeFormat("%Y"));

    g.selectAll(".xAxis")
        .data([0])
      .enter().append("g")
        .attr("class", "xAxis")
        .attr("transform", "translate(" + 0 + "," + height + ")");

    g.select(".xAxis").transition().call(xAxis);

    var yAxisScale = d3.scaleLinear()
        .domain([0, (y.domain()[1] - y.domain()[0]) / 10])
        .range([height * 0.5, height * 0.4]);

    var yAxis = d3.axisLeft(yAxisScale)
        .ticks(2);

    g.selectAll(".yAxis")
        .data([0])
      .enter().append("g")
        .attr("class", "yAxis");

    g.select(".yAxis").transition().call(yAxis);

    // Enable tooltips
    $('[data-toggle="tooltip"]').tooltip({
      container: "body",
      placement: "auto top",
      animation: false
    });

    d3.selectAll(".tooltip").style("pointer-events", "none");
  }

  function stringToNumber(s) {
    var v = +s.split(",").join("");
    return isNaN(v) ? 0 : v;
  }
}
