function connectedScatterPlot(data) {
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
      .key(function(d) { return d.State; }).sortKeys(d3.ascending)
      .key(function(d) { return d.Firm_Age; })
      .key(function(d) { return d.Year; }).sortKeys(d3.ascending)
      .rollup(function(d) { return d[0]; })
      .object(data);

  var states = d3.keys(nest),
      firmAges = d3.keys(nest[states[0]]);

  data = d3.keys(nest).map(function(d) {
    var state = nest[d];

    d3.keys(state).forEach(function(d) {
      var firmAge = state[d];
      var years = d3.keys(firmAge);

      state[d] = d3.keys(firmAge).map(function(d) {
        return {
          year: d,
          data: firmAge[d]
        };
      });
    });

    return {
      state: d,
      firmAges: state
    };
  });

  console.log(data);

  // Set up GUI
  var firmAge = "ALL",
      xMetric = "Firms",
      yMetric = "Job_Creation_Rate",
      dragTypes = {
        "Nearest": d3.pointDragNearest(),
        "Nearest Neighbor": d3.pointDragNearestNeighbor(),
        "Nearest Neighbor Direction": d3.pointDragNearestNeighborDirection(),
        "Local Direction": d3.pointDragLocalDirection(),
        "Global Direction": d3.pointDragGlobalDirection()
      },
      dragType = "Nearest";

  d3.select("#firmAgeSelect")
      .on("change", function(d) {
        firmAge = this.value;
        drawConnectedScatterPlot(firmAge, xMetric, yMetric, dragTypes[dragType]);
      })
    .selectAll("option")
      .data(firmAges)
    .enter().append("option")
      .attr("value", function(d) { return d; })
      .property("selected", function(d) { return d === firmAge; })
      .text(function(d) { return d; });

  d3.select("#xAxisSelect")
      .on("change", function(d) {
        xMetric = this.value;
        drawConnectedScatterPlot(firmAge, xMetric, yMetric, dragTypes[dragType]);
      })
    .selectAll("option")
      .data(metrics)
    .enter().append("option")
      .attr("value", function(d) { return d; })
      .property("selected", function(d) { return d === xMetric; })
      .text(function(d) { return d; });

  d3.select("#yAxisSelect")
      .on("change", function() {
        yMetric = this.value;
        drawConnectedScatterPlot(firmAge, xMetric, yMetric, dragTypes[dragType]);
      })
    .selectAll("option")
      .data(metrics)
    .enter().append("option")
      .attr("value", function(d) { return d; })
      .property("selected", function(d) { return d === yMetric; })
      .text(function(d) { return d; });

  highlightWindow = 4;

  d3.select("#highlightWindowRange")
      .attr("max", (data[0].firmAges["0"].length - 1) * 2)
      .on("input", function(d) {
        d3.select("#highlightWindowLabel")
            .text(this.value);
      })
      .on("change", function(d) {
        highlightWindow = this.value;
        d3.select("#highlightWindowLabel")
            .text(highlightWindow);
        drawConnectedScatterPlot(firmAge, xMetric, yMetric, dragTypes[dragType]);
      });

  d3.select("#highlightWindowLabel")
      .text(d3.select("#highlightWindowRange").node().value);

  d3.select("#dragSelect")
      .on("change", function() {
        console.log(this.value);

        dragType = this.value;
        drawConnectedScatterPlot(firmAge, xMetric, yMetric, dragTypes[dragType]);
      })
    .selectAll("option")
      .data(d3.keys(dragTypes))
    .enter().append("option")
      .attr("value", function(d) { return d; })
      .text(function(d) { return d; });

  d3.select("#allButton").on("click", function() {
    activeStates = states.slice();
    highlightStates = [];
    d3.selectAll(".stateCheckbox").property("checked", true);
    drawConnectedScatterPlot(firmAge, xMetric, yMetric, dragTypes[dragType]);
  });

  d3.select("#noneButton").on("click", function() {
    activeStates = [];
    highlightStates = [];
    d3.selectAll(".stateCheckbox").property("checked", false);
    drawConnectedScatterPlot(firmAge, xMetric, yMetric, dragTypes[dragType]);
  });

  d3.select("#highlightedButton").on("click", function() {
    activeStates = highlightStates.slice();
    activeStates.sort(d3.ascending);
    d3.selectAll(".stateCheckbox").property("checked", function(d) {
      return activeStates.indexOf(d3.select(this).node().value) !== -1;
    });
    drawConnectedScatterPlot(firmAge, xMetric, yMetric, dragTypes[dragType]);
  });

  var halfStates = Math.ceil(states.length / 2);

  d3.select("#stateCheckboxes1").selectAll(".checkbox")
      .data(states.slice(0, halfStates))
    .enter().append("div")
      .attr("class", "checkbox")
      .html(checkboxHTML);

  d3.select("#stateCheckboxes2").selectAll(".checkbox")
      .data(states.slice(halfStates))
    .enter().append("div")
      .attr("class", "checkbox")
      .html(checkboxHTML);

  var activeStates = states.slice()
      highlightStates = [];

  d3.selectAll(".stateCheckbox").on("change", function(d) {
    if (this.checked) {
      if (activeStates.indexOf(this.value) === -1) {
        activeStates.push(this.value);
        activeStates.sort(d3.ascending);
      }
      if (highlightStates.indexOf(this.value) === -1) {
        highlightStates.push(this.value);
      }
    }
    else {
      var index = activeStates.indexOf(this.value);
      if (index > -1) {
        activeStates.splice(index, 1);
      }

      index = highlightStates.indexOf(this.value);
      if (index > -1) {
        highlightStates.splice(index, 1);
      }
    }

    drawConnectedScatterPlot(firmAge, xMetric, yMetric, dragTypes[dragType]);
  });

  // Can't get d3 to correctly add input to label, so define html directly
  function checkboxHTML(d) {
    return "<span><label>" +
           "<input type='checkbox' class='stateCheckbox' value=" + d + " checked>" + d +
           "</label><div class='legend' style='float:right; background-color:red; width:15px; height:10px; margin-top:5px'></div></span>";
  }

  d3.selectAll(".checkbox > label").text(function(d) { return d; });

  // Draw initial visualization
  drawConnectedScatterPlot(firmAge, xMetric, yMetric, dragTypes[dragType]);

  function drawConnectedScatterPlot(firmAge, xMetric, yMetric, drag) {
    // Get svg element
    var svg = d3.select("#connectedScatterPlot");

    // Set up size and margins
    var svgWidth = parseInt(svg.style("width")),
        svgHeight = parseInt(svg.style("height")),
        margin = { top: 40, right: 40, bottom: 40, left: 80 }
        width = svgWidth - margin.left - margin.right,
        height = svgHeight - margin.top - margin.bottom;

    // Set margins for group
    var g = svg.select("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Convert and filter data for rendering
    var plotData = data.map(function(d) {
      return {
        state: d.state,
        years: d.firmAges[firmAge]
      };
    }).filter(function(d) {
      return activeStates.indexOf(d.state) !== -1;
    });

    console.log(plotData);

    // X scale
    var x = d3.scaleLinear()
        .domain(d3.extent(d3.merge(plotData.map(function(d) {
          return d.years.map(function(d) {
            return d.data[xMetric];
          });
        }))))
        .range([0, width]);

    // Y scale
    var y = d3.scaleLinear()
        .domain(d3.extent(d3.merge(plotData.map(function(d) {
          return d.years.map(function(d) {
            return d.data[yMetric];
          });
        }))))
        .range([height, 0]);

    // Color scale
    var color = d3.scaleOrdinal(d3.schemeSet2)
        .domain(activeStates);

    // Update checkboxes
    d3.selectAll(".checkbox").select(".legend")
        .style("background-color", function(d) {
          return activeStates.indexOf(d)=== -1 ? "transparent" : color(d);
        });

    // Shape for drawing lines
    var lineShape = d3.line()
        .x(function(d) { return x(d.data[xMetric]); })
        .y(function(d) { return y(d.data[yMetric]); })
        .defined(function(d) { return d.data[xMetric] !== 0 && d.data[yMetric] !== 0; })
        .curve(d3.curveCatmullRomOpen);

    // Highlight lines and points
    function highlight(state, year) {
      // Add state to highlight states if defined
      var states = highlightStates.slice();
      if (state !== undefined && states.indexOf(state) === -1) {
        states.push(state);
      };

      if (states.length > 0) {
        // Opacity scales for year highlighting
        var w = Math.floor(highlightWindow / 2),
            lineScale = d3.scaleThreshold()
                .domain([-w, w])
                .range([0.2, 1.0, 0.2]),
            pointScale = d3.scaleThreshold()
                .domain([-w, w + 1])
                .range(lineScale.range());

        // Line opacity function
        function lineOpacity(d) {
          var v = states.indexOf(d[0].data.State) === -1 ? 0.1 : 1.0;

          if (year !== undefined) {
            v *= lineScale(+d[1].data.Year - +year);
          }

          return v;
        }

        // Point opacity function
        function pointOpacity(d) {
          var v = states.indexOf(d.data.State) === -1 ? 0.1 : 1.0;

          if (year !== undefined) {
            v *= pointScale(+d.year - +year);
          }

          return v;
        }

        var strokeHighlight = "#666";

        // Highlight lines and points
        g.selectAll(".line")
            .style("stroke-opacity", lineOpacity);

        g.selectAll(".state").selectAll(".point")
            .style("stroke", function(d, i) {
              if (year === undefined) {
                return i === 0 ? strokeHighlight : "white";
              }
              else {
                return d.year === year ? strokeHighlight : "white";
              }
            })
            .style("fill-opacity", pointOpacity)
            .style("stroke-opacity", pointOpacity);
      }
      else {
        // No highlight states, so render all with full opacity
        g.selectAll(".state").selectAll(".line")
            .style("stroke-opacity", 1);

        g.selectAll(".state").selectAll(".point")
            .style("stroke", function(d, i) {
                return i === 0 ? strokeHighlight : "white";
            })
            .style("fill-opacity", 1)
            .style("stroke-opacity", 1);
      }

      // Tooltips
      if (state !== undefined) {
        g.selectAll(".state").each(function(d) {
          if (d.state === state) {
            $(d3.select(this).node()).tooltip("show");

            if (year !== undefined) {
              d3.select(this).selectAll(".point").each(function(d) {
                if (d.year === year) {
                  $(d3.select(this).node()).tooltip("show");
                }
                else {
                  $(d3.select(this).node()).tooltip("hide");
                }
              });
            }
          }
          else {
            $(d3.select(this).node()).tooltip("hide");
          }
        });
      }
      else {
        $('[data-toggle="tooltip"]').tooltip("hide");
      }
    }

    function lineData(d) {
      // Return line sections with control points for four years of data,
      return d3.range(d.years.length - 1).map(function(index) {
        if (index === 0) {
          return [d.years[0]].concat(d.years.slice(0, 3));
        }
        else if (index === d.years.length - 2) {
          return d.years.slice(index - 1, index + 2).concat([d.years[index + 1]]);
        }
        else {
          return d.years.slice(index - 1, index + 3);
        }
      });
    }

    // Bind data for each state
    var state = g.selectAll(".state")
        .data(plotData, function(d) { return d.state; });

    // State enter
    var stateEnter = state.enter().append("g")
        .attr("class", "state")
        .attr("data-toggle", "tooltip")
        .attr("title", function(d) { return d.state; })
        .on("click", function(d) {
          // Toggle highlighting for this state
          var index = highlightStates.indexOf(d.state);
          if (index > -1) {
              highlightStates.splice(index, 1);
          }
          else {
            highlightStates.push(d.state);
          }

          // Update highlighting
          highlight();
        });

    // State enter + update
    stateEnter.merge(state)
        .each(function(d, i) {
          var state = d3.select(this);

          // Line
          var line = state.selectAll(".line")
              .data(lineData);

          var lineEnter = line.enter().append("path")
              .attr("class", "line")
              .attr("d", function(d) { return lineShape(d); })
              .style("fill", "none")
              .style("stroke", color(d.state))
              .style("stroke-width", 2)
              .on("mouseover", function(d) {
                highlight(d[0].data.State);
              })
              .on("mouseout", function(d) {
                highlight();
              });

          lineEnter.merge(line).transition()
              .attr("d", function(d) { return lineShape(d); })
              .style("stroke", color(d.state));

          line.exit().transition()
              .style("fill-opacity", 0)
              .style("stroke-opacity", 0)
              .remove();

          // Points
          var triangle = d3.symbol().type(d3.symbolTriangle);

          var point = state.selectAll(".point")
              .data(function(d) { return d.years; },
                    function(d) { return d.year; });

          var pointEnter = point.enter().append("path")
              .attr("class", "point")
              .attr("d", triangle)
              .attr("transform", pointTransform)
              .attr("x", function(d) { return x(d.data[xMetric]); })
              .attr("y", function(d) { return y(d.data[yMetric]); })
              .attr("data-toggle", "tooltip")
              .attr("title", function(d) { return d.year; })
              .style("fill", color(d.state))
              .style("stroke", "white")
              .on("mouseover", function(d, i) {
                highlight(d.data.State, d.year);
              })
              .on("mouseout", function(d) {
                highlight();
              });

          pointEnter.merge(point)
              .call(drag.on("drag", function(d) { highlight(d.data.State, d.year); })
                        .on("end", function(d) { highlight(); }))
            .transition()
              .attr("transform", pointTransform)
              .attr("x", function(d) { return x(d.data[xMetric]); })
              .attr("y", function(d) { return y(d.data[yMetric]); })
              .style("fill", color(d.state));

          point.exit().transition()
              .style("fill-opacity", 0)
              .style("stroke-opacity", 0)
              .remove();

          function pointTransform(p, i) {
            var px = x(p.data[xMetric]),
                py = y(p.data[yMetric]);

            // Get direction
            var vx, vy;
            if (i === 0) {
              vx = x(d.years[i + 1].data[xMetric]) - px;
              vy = y(d.years[i + 1].data[yMetric]) - py;
            }
            else if (i === d.years.length - 1) {
              vx = px - x(d.years[i - 1].data[xMetric]);
              vy = py - y(d.years[i - 1].data[yMetric]);
            }
            else {
              v1x = px - x(d.years[i - 1].data[xMetric]);
              v1y = py - y(d.years[i - 1].data[yMetric]);
              v1mag = Math.sqrt(v1x * v1x + v1y * v1y);

              v1x /= v1mag;
              v1y /= v1mag;

              v2x = x(d.years[i + 1].data[xMetric]) - px;
              v2y = y(d.years[i + 1].data[yMetric]) - py;

              v2mag = Math.sqrt(v2x * v2x + v2y * v2y);

              v2x /= v2mag;
              v2y /= v2mag;

              vx = (v1x + v2x) / 2;
              vy = (v1y + v2y) / 2;
            }

            var theta = Math.atan2(vy, vx) * 180 / Math.PI + 90;

            return "translate(" + x(p.data[xMetric]) + "," + y(p.data[yMetric]) + ")" +
                   "rotate(" + theta + ")" +
                   "scale(0.75, 1.25)";
          }
        });

    // State exit
    state.exit()
        .each(function(d) {
          var state = d3.select(this);

          state.selectAll(".line").transition()
              .style("stroke-opacity", 0)
              .remove();

          state.selectAll(".point").transition()
              .style("fill-opacity", 0)
              .style("stroke-opacity", 0)
              .remove();
        })
        .remove();

    // Apply highlighting
    highlight();

    // X axis
    var xAxis = d3.axisBottom(x);

    g.selectAll(".xAxis")
        .data([0])
      .enter().append("g")
        .attr("class", "xAxis")
        .attr("transform", "translate(" + 0 + "," + height + ")");

    g.select(".xAxis").transition()
        .attr("transform", "translate(" + 0 + "," + height + ")")
        .call(xAxis);

    g.selectAll(".xLabel")
        .data([0])
      .enter().append("text")
        .text(xMetric)
        .attr("class", "xLabel")
        .attr("transform", "translate(" + (width / 2) + "," + (height + margin.bottom) + ")")
        .attr("dy", "-.2em")
        .style("text-anchor", "middle");

    g.select(".xLabel").transition()
        .text(xMetric)
        .attr("transform", "translate(" + (width / 2) + "," + (height + margin.bottom) + ")");

    // Y axis
    var yAxis = d3.axisLeft(y);

    g.selectAll(".yAxis")
        .data([0])
      .enter().append("g")
        .attr("class", "yAxis");

    g.select(".yAxis").transition().call(yAxis);

    g.selectAll(".yLabel")
        .data([0])
      .enter().append("text")
        .text(yMetric)
        .attr("class", "yLabel")
        .attr("transform", "translate(" + -margin.left + "," + (height / 2) + ")rotate(-90)")
        .attr("dy", "1.2em")
        .style("text-anchor", "middle");

    g.select(".yLabel").transition()
        .text(yMetric)
        .attr("transform", "translate(" + -margin.left + "," + (height / 2) + ")rotate(-90)");

    // Enable tooltips
    $('[data-toggle="tooltip"]').tooltip({
      container: "body",
      placement: "auto top",
      animation: false,
      trigger: "manual"
    });

    d3.selectAll(".tooltip").style("pointer-events", "none");
  }

  function stringToNumber(s) {
    var v = +s.split(",").join("");
    return isNaN(v) ? 0 : v;
  }
}
