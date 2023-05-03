d3.json('target2.topojson').then((topology) => {
  const svg = d3.select('svg')
  const width = svg.node().getBoundingClientRect().width
  const height = svg.node().getBoundingClientRect().height

  // Create a projection for the map
  const projection = d3
    .geoMercator()
    .fitSize(
      [width, height],
      topojson.feature(topology, topology.objects.target2),
    )

  // Create a path generator
  const path = d3.geoPath().projection(projection)

  // Draw the map
  svg
    .selectAll('path')
    .data(topojson.feature(topology, topology.objects.target2).features)
    .join('path')
    .attr('d', path)
    .attr('fill', '#ccc')
    .attr('stroke', '#000')
    .attr('stroke-width', 0.5)
})
