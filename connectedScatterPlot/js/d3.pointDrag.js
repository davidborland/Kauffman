// Select the closest point, regardless of order
(function() {
  d3.pointDragNearest = function() {
    var x = function(node) { return +node.attr("x"); },
        y = function(node) { return +node.attr("y"); },
        dispatcher = d3.dispatch("start", "drag", "end");

    // Create a closure containing the above variables
    function pd(selection) {
      var points,
          currentPoint;

      selection.call(d3.drag()
          .on("start", function() {
            points = selection.nodes().map(function(d) {
              var node = d3.select(d);
              return {
                data: node.datum(),
                x: x(node),
                y: y(node)
              };
            });

            currentPoint = points[selection.data().indexOf(d3.event.subject)];

            dispatcher.call("start", this, d3.event.subject);
          })
          .on("drag", function() {
            var p = {
              x: d3.event.x,
              y: d3.event.y
            };

            currentPoint = points[0];
            var dsq = distanceSquared(currentPoint, p);

            for (var i = 1; i < points.length; i++) {
              var d = distanceSquared(points[i], p);

              if (d < dsq) {
                currentPoint = points[i];
                dsq = d;
              }
            }

            dispatcher.call("drag", this, currentPoint.data);
          })
          .on("end", function() {
            dispatcher.call("end", this, currentPoint.data);
          }));
    }

    pd.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      return pd;
    };

    pd.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return pd;
    };

    pd.on = function() {
      var value = dispatcher.on.apply(dispatcher, arguments);
      return value === dispatcher ? pd : value;
    };

    return pd;
  }
})();

// Select the closest point before or after the current point
(function() {
  d3.pointDragNearestNeighbor = function() {
    var x = function(node) { return +node.attr("x"); },
        y = function(node) { return +node.attr("y"); },
        dispatcher = d3.dispatch("start", "drag", "end");

    // Create a closure containing the above variables
    function pd(selection) {
      var points,
          currentIndex;

      selection.call(d3.drag()
          .on("start", function() {
            points = selection.nodes().map(function(d) {
              var node = d3.select(d);
              return {
                data: node.datum(),
                x: x(node),
                y: y(node)
              };
            });

            currentIndex = selection.data().indexOf(d3.event.subject);

            dispatcher.call("start", this, d3.event.subject);
          })
          .on("drag", function() {
            var p = {
              x: d3.event.x,
              y: d3.event.y
            };

            var i1 = Math.max(0, currentIndex - 1),
                i2 = Math.min(currentIndex + 1, points.length - 1);

            currentIndex = i1;
            var dsq = distanceSquared(points[i1], p);

            for (var i = i1 + 1; i <= i2; i++) {
              var d = distanceSquared(points[i], p);

              if (d < dsq) {
                currentIndex = i;
                dsq = d;
              }
            }

            dispatcher.call("drag", this, points[currentIndex].data);
          })
          .on("end", function() {
            dispatcher.call("end", this, points[currentIndex].data);
          }));
    }

    pd.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      return pd;
    };

    pd.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return pd;
    };

    pd.on = function() {
      var value = dispatcher.on.apply(dispatcher, arguments);
      return value === dispatcher ? pd : value;
    };

    return pd;
  }
})();

// Select the next point before or after the current point based on the drag direction
(function() {
  d3.pointDragNearestNeighborDirection = function() {
    var x = function(node) { return +node.attr("x"); },
        y = function(node) { return +node.attr("y"); },
        dispatcher = d3.dispatch("start", "drag", "end");

    // Create a closure containing the above variables
    function pd(selection) {
      var points,
          currentIndex;

      selection.call(d3.drag()
          .on("start", function() {
            points = selection.nodes().map(function(d) {
              var node = d3.select(d);
              return {
                data: node.datum(),
                x: x(node),
                y: y(node)
              };
            });

            currentIndex = selection.data().indexOf(d3.event.subject);

            dispatcher.call("start", this, d3.event.subject);
          })
          .on("drag", function() {
            var p = {
              x: d3.event.x,
              y: d3.event.y
            };

            if (currentIndex === 0) {
              var pCurrent = points[currentIndex],
                  pNext = points[currentIndex + 1];

              if (distance(pNext, p) < distance(p, pCurrent)) {
                currentIndex++;
              }
            }
            else if (currentIndex === points.length - 1) {
              var pPrevious = points[currentIndex - 1],
                  pCurrent = points[currentIndex];

              if (distance(pPrevious, p) < distance(p, pCurrent)) {
                currentIndex--;
              }
            }
            else {
              var pPrevious = points[currentIndex - 1],
                  pCurrent = points[currentIndex],
                  pNext = points[currentIndex + 1];

              var d0 = distance(p, pCurrent),
                  d1 = distance(pPrevious, pCurrent),
                  d2 = distance(pNext, pCurrent);

              var v0 = {
                x: (p.x - pCurrent.x) / d0,
                y: (p.y - pCurrent.y) / d0
              };

              var v1 = {
                x: (pPrevious.x - pCurrent.x) / d1,
                y: (pPrevious.y - pCurrent.y) / d1
              };

              var v2 = {
                x: (pNext.x - pCurrent.x) / d2,
                y: (pNext.y - pCurrent.y) / d2
              };

              var a1 = angle(v1, v0),
                  a2 = angle(v2, v0);

              if (distance(pPrevious, p) < d0 && a1 < a2) {
                currentIndex--;
              }
              else if (distance(pNext, p) < d0 && a2 < a1) {
                currentIndex++;
              }
            }

            dispatcher.call("drag", this, points[currentIndex].data);
          })
          .on("end", function() {
            dispatcher.call("end", this, points[currentIndex].data);
          }));
    }

    pd.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      return pd;
    };

    pd.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return pd;
    };

    pd.on = function() {
      var value = dispatcher.on.apply(dispatcher, arguments);
      return value === dispatcher ? pd : value;
    };

    return pd;
  }
})();

// Define a direction vector for dragging based on the neighboring points when first dragging
(function() {
  d3.pointDragLocalDirection = function() {
    var startThreshold = 5,
        x = function(node) { return +node.attr("x"); },
        y = function(node) { return +node.attr("y"); },
        dispatcher = d3.dispatch("start", "drag", "end");

    // Create a closure containing the above variables
    function pd(selection) {
      var startPosition,
          startDistance,
          motionVector,
          curveDirection,
          linePoints,
          currentPoint,
          distanceScale = d3.scaleLinear();

      selection.call(d3.drag()
          .on("start", function() {
            startPosition = {
              x: d3.event.x,
              y: d3.event.y
            };
            startDistance = 0;
            motionVector = null;
            curveDirection = 0;
            linePoints = [],
            currentPoint = d3.event.subject;

            dispatcher.call("start", this, currentPoint);
          })
          .on("drag", function() {
            var p = {
              x: d3.event.x,
              y: d3.event.y
            };

            // Check for motion above threshold
            if (motionVector === null) {
              var d = distance(startPosition, p);

              if (d > startThreshold) {
                // Save motion direction
                motionVector = {
                  x: (p.x - startPosition.x) / d,
                  y: (p.y - startPosition.y) / d
                };

                // Get previous, next, and this point
                var allPoints = selection.nodes().map(function(d) {
                  var node = d3.select(d);
                  return {
                    point: node.datum(),
                    x: x(node),
                    y: y(node)
                  };
                });

                var i = allPoints.map(function(d) {
                  return d.point;
                }).indexOf(d3.event.subject);

                var points = allPoints.filter(function(d, j) {
                  return j === i || j === i - 1 || j === i + 1;
                });

                // Determine curve direction
                if (i === 0) {
                  var pCurrent = points[0],
                      pNext = points[1];

                  var d = distance(pNext, pCurrent);

                  var v = {
                    x: (pNext.x - pCurrent.x) / d,
                    y: (pNext.y - pCurrent.y) / d
                  };

                  var a1 = angle(v, motionVector),
                      a2 = angle({ x: -v.x, y: -v.y }, motionVector);

                  curveDirection = a1 < a2 ? 1 : -1;
                }
                else if (i === allPoints.length - 1) {
                  var pPrevious = points[0],
                      pCurrent = points[1];

                  var d = distance(pPrevious, pCurrent);

                  var v = {
                    x: (pPrevious.x - pCurrent.x) / d,
                    y: (pPrevious.y - pCurrent.y) / d
                  };

                  var a1 = angle(v, motionVector),
                      a2 = angle({ x: -v.x, y: -v.y }, motionVector);

                  curveDirection = a1 < a2 ? -1 : 1;
                }
                else {
                  var pPrevious = points[0],
                      pCurrent = points[1],
                      pNext = points[2];

                  var d1 = distance(pPrevious, pCurrent),
                      d2 = distance(pNext, pCurrent);

                  var v1 = {
                    x: (pPrevious.x - pCurrent.x) / d1,
                    y: (pPrevious.y - pCurrent.y) / d1
                  };

                  var v2 = {
                    x: (pNext.x - pCurrent.x) / d2,
                    y: (pNext.y - pCurrent.y) / d2
                  };

                  var a1 = angle(v1, motionVector),
                      a2 = angle(v2, motionVector);

                  curveDirection = a1 < a2 ? -1 : 1;
                }

                // Match motion direction to curve direction
                motionVector.x *= curveDirection;
                motionVector.y *= curveDirection;

                // Map points to line
                var cumDist = 0;
                linePoints = allPoints.map(function(d, i, a) {
                  cumDist += i === 0 ? 0 : distance(d, a[i - 1]);

                  return {
                    point: d.point,
                    x: cumDist
                  };
                });

                // Save start distance along line
                startDistance = linePoints[i].x;

                // Get max distance between points
                var maxDistance = 0;
                allPoints.forEach(function(d) {
                  allPoints.forEach(function(e) {
                    var dist = distance(d, e);
                    if (dist > maxDistance) maxDistance = dist;
                  });
                });

                // Set distance scale
                distanceScale
                    .domain([0, maxDistance])
                    .range([0, linePoints[linePoints.length - 1].x]);
              }
              else {
                dispatcher.call("drag", this, currentPoint);
                return;
              }
            }

            // Project point onto motion direction line
            var v = {
              x: p.x - startPosition.x,
              y: p.y - startPosition.y
            };

            var d = distanceScale(dot(v, motionVector)) + startDistance;

            // Find closest point
            currentPoint = linePoints.reduce(function(p, c, a) {
              return Math.abs(c.x - d) < Math.abs(p.x -d) ? c : p;
            }).point;

            dispatcher.call("drag", this, currentPoint);
          })
          .on("end", function() {
            dispatcher.call("end", this, currentPoint);
          }));
    }

    pd.startThreshold = function(_) {
      if (!arguments.length) return startThreshold;
      startThreshold = _;
      return pd;
    };

    pd.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      return pd;
    };

    pd.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return pd;
    };

    pd.on = function() {
      var value = dispatcher.on.apply(dispatcher, arguments);
      return value === dispatcher ? pd : value;
    };

    return pd;
  }
})();

// Define a direction vector for dragging based on the global start and end points
(function() {
  d3.pointDragGlobalDirection = function() {
    var startThreshold = 5,
        x = function(node) { return +node.attr("x"); },
        y = function(node) { return +node.attr("y"); },
        dispatcher = d3.dispatch("start", "drag", "end");

    // Create a closure containing the above variables
    function pd(selection) {
      var startPosition,
          startDistance,
          motionVector,
          curveDirection,
          linePoints,
          currentPoint,
          distanceScale = d3.scaleLinear();

      selection.call(d3.drag()
          .on("start", function() {
            startPosition = {
              x: d3.event.x,
              y: d3.event.y
            };
            startDistance = 0;
            motionVector = null;
            curveDirection = 0;
            linePoints = [],
            currentPoint = d3.event.subject;

            dispatcher.call("start", this, currentPoint);
          })
          .on("drag", function() {
            var p = {
              x: d3.event.x,
              y: d3.event.y
            };

            // Check for motion above threshold
            if (motionVector === null) {
              var d = distance(startPosition, p);

              if (d > startThreshold) {
                // Save motion direction
                motionVector = {
                  x: (p.x - startPosition.x) / d,
                  y: (p.y - startPosition.y) / d
                };

                // Get first, last, and this point
                var allPoints = selection.nodes().map(function(d) {
                  var node = d3.select(d);
                  return {
                    point: node.datum(),
                    x: x(node),
                    y: y(node)
                  };
                });

                var i = allPoints.map(function(d) {
                  return d.point;
                }).indexOf(d3.event.subject);

                var points = allPoints.filter(function(d, j, a) {
                  return j === i || j === 0 || j === a.length - 1;
                });

                // Determine curve direction
                if (i === 0) {
                  var pCurrent = points[0],
                      pLast = points[1];

                  var d = distance(pLast, pCurrent);

                  var v = {
                    x: (pLast.x - pCurrent.x) / d,
                    y: (pLast.y - pCurrent.y) / d
                  };

                  var a1 = angle(v, motionVector),
                      a2 = angle({ x: -v.x, y: -v.y }, motionVector);

                  curveDirection = a1 < a2 ? 1 : -1;
                }
                else if (i === allPoints.length - 1) {
                  var pFirst = points[0],
                      pCurrent = points[1];

                  var d = distance(pFirst, pCurrent);

                  var v = {
                    x: (pFirst.x - pCurrent.x) / d,
                    y: (pFirst.y - pCurrent.y) / d
                  };

                  var a1 = angle(v, motionVector),
                      a2 = angle({ x: -v.x, y: -v.y }, motionVector);

                  curveDirection = a1 < a2 ? -1 : 1;
                }
                else {
                  var pFirst = points[0],
                      pCurrent = points[1],
                      pLast = points[2];

                  var d1 = distance(pFirst, pCurrent),
                      d2 = distance(pLast, pCurrent);

                  var v1 = {
                    x: (pFirst.x - pCurrent.x) / d1,
                    y: (pFirst.y - pCurrent.y) / d1
                  };

                  var v2 = {
                    x: (pLast.x - pCurrent.x) / d2,
                    y: (pLast.y - pCurrent.y) / d2
                  };

                  var a1 = angle(v1, motionVector),
                      a2 = angle(v2, motionVector);

                  curveDirection = a1 < a2 ? -1 : 1;
                }

                // Match motion direction to curve direction
                motionVector.x *= curveDirection;
                motionVector.y *= curveDirection;

                // Map points to line
                var cumDist = 0;
                linePoints = allPoints.map(function(d, i, a) {
                  cumDist += i === 0 ? 0 : distance(d, a[i - 1]);

                  return {
                    point: d.point,
                    x: cumDist
                  };
                });

                // Save start distance along line
                startDistance = linePoints[i].x;

                // Get max distance between points
                var maxDistance = 0;
                allPoints.forEach(function(d) {
                  allPoints.forEach(function(e) {
                    var dist = distance(d, e);
                    if (dist > maxDistance) maxDistance = dist;
                  });
                });

                // Set distance scale
                distanceScale
                    .domain([0, maxDistance])
                    .range([0, linePoints[linePoints.length - 1].x]);
              }
              else {
                dispatcher.call("drag", this, currentPoint);
                return;
              }
            }

            // Project point onto motion direction line
            var v = {
              x: p.x - startPosition.x,
              y: p.y - startPosition.y
            };

            var d = distanceScale(dot(v, motionVector)) + startDistance;

            // Find closest point
            currentPoint = linePoints.reduce(function(p, c, a) {
              return Math.abs(c.x - d) < Math.abs(p.x -d) ? c : p;
            }).point;

            dispatcher.call("drag", this, currentPoint);
          })
          .on("end", function() {
            dispatcher.call("end", this, currentPoint);
          }));
    }

    pd.startThreshold = function(_) {
      if (!arguments.length) return startThreshold;
      startThreshold = _;
      return pd;
    };

    pd.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      return pd;
    };

    pd.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return pd;
    };

    pd.on = function() {
      var value = dispatcher.on.apply(dispatcher, arguments);
      return value === dispatcher ? pd : value;
    };

    return pd;
  }
})();

function clamp(x, xMin, xMax) {
  return Math.min(Math.max(x, xMin), xMax);
}

function distanceSquared(p1, p2) {
  var x = p1.x - p2.x,
      y = p1.y - p2.y;

  return x * x + y * y;
}

function distance(p1, p2) {
  return Math.sqrt(distanceSquared(p1, p2));
}

function angle(v1, v2) {
  //return Math.atan2(v2.y, v2.x) - Math.atan2(v1.y, v1.x);
  return Math.acos(v1.x * v2.x + v1.y * v2.y);
}

function dot(v1, v2) {
  return v1.x * v2.x + v1.y * v2.y;
}
