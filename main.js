// Load and aggregate the data
let locationPopulation = {}
let minPopulation = 100
let maxPopulation = 50000
let selectedDateId = '20230401' // Initialize the selected date
let selectedHour = 16 // Initialize the selected hour

d3.csv('LOCAL_PEOPLE_DONG_202304_reduced.csv').then((data) => {
  data.forEach((d) => {
    const timeCategory = +d['시간대구분'] // convert to number
    const regionCode = d['행정동코드']
    const totalPopulation = +d['총생활인구수'] // convert to number
    const dateId = d['기준일ID'] // date from the dataset
    minPopulation = Math.min(minPopulation, totalPopulation)
    maxPopulation = Math.max(maxPopulation, totalPopulation)

    // Initialize an object for this region code if it doesn't exist
    if (!locationPopulation[regionCode]) {
      locationPopulation[regionCode] = {
        dateId,
        population: Array(24).fill(0), // Initialize to an array of 24 zeros
      }
    }

    // Set the population for the corresponding hour for this region
    locationPopulation[regionCode].population[timeCategory] = totalPopulation
  })

  d3.json('target.topojson').then((topology) => {
    const svg = d3.select('svg')
    const width = svg.node().getBoundingClientRect().width
    const height = svg.node().getBoundingClientRect().height

    // Create a projection for the map
    const projection = d3
      .geoMercator()
      .fitSize(
        [width, height],
        topojson.feature(topology, topology.objects.target),
      )

    // Create a path generator
    const path = d3.geoPath().projection(projection)

    // Create a color scale
    const colorScale = d3
      .scaleSequential(d3.interpolateYlOrBr)
      .domain([100, 90000]) // min and max population values

    // Function to handle click events
    // Function to handle click events
    const handleClick = (event, d) => {
      // 'd' contains the feature data of the clicked path
      // Check if the population data for the region exists
      const population = locationPopulation[d.properties.adm_cd2]
      if (population) {
        // If it exists, log the region's code, date from the dataset, and total population
        console.log('Clicked feature code:', d.properties.adm_cd2)
        console.log('Date:', population.dateId)
        console.log('population', population.population[selectedHour])
        console.log('time', selectedHour)
      } else {
        // If it doesn't exist, log a default message
        console.log('No data for clicked feature code:', d.properties.adm_cd2)
      }
    }

    // Function to handle mouseover events
    const handleMouseOver = (event, d) => {
      // Change the fill color of the hovered path
      d3.select(event.currentTarget).attr('fill', '#f00')
    }

    // Function to handle mouseout events
    // Function to handle mouseout events
    const handleMouseOut = (event, d) => {
      // Check if the population data for the region exists
      const populationData = locationPopulation[d.properties.adm_cd2]
      if (populationData && Array.isArray(populationData.population)) {
        // If it exists, revert the fill color of the path back to its original color
        d3.select(event.currentTarget).attr(
          'fill',
          colorScale(d3.max(populationData.population)),
        )
      } else {
        // If it doesn't exist, set a default color
        d3.select(event.currentTarget).attr('fill', '#ccc')
      }
    }

    // Draw the map
    const mapPaths = svg
      .selectAll('path')
      .data(topojson.feature(topology, topology.objects.target).features)
      .join('path')
      .attr('d', path)
      .attr('fill', (d) => {
        const populationData = locationPopulation[d.properties.adm_cd2]
        if (populationData && populationData.population) {
          return colorScale(d3.max(populationData.population))
        } else {
          return '#ccc' // default to light grey if no population data
        }
      })
      .attr('stroke', '#000')
      .attr('stroke-width', 0.5)
      .on('click', handleClick)
      .on('mouseover', handleMouseOver)
      .on('mouseout', handleMouseOut)

    // Function to update map colors
    const updateMapColors = (hour) => {
      mapPaths.attr('fill', (d) => {
        console.log('d.properties.adm_cd2:', d.properties.adm_cd2) // add this line
        const populationData = locationPopulation[d.properties.adm_cd2]
        console.log('populationData:', populationData) // add this line
        if (populationData && populationData.population) {
          console.log(
            'populationData.population[hour]:',
            populationData.population[hour],
          ) // add this line
          return colorScale(populationData.population[hour])
        } else {
          return '#ccc'
        }
      })
    }

    d3.select('#datePicker').on('change', function () {
      selectedDateId = this.value.replaceAll('-', '')

      // Now filter the data based on the selected date
      let filteredData = data.filter((d) => d['기준일ID'] === selectedDateId)

      // Reset locationPopulation
      locationPopulation = {}

      // Recalculate locationPopulation based on the filtered data
      filteredData.forEach((d) => {
        const timeCategory = +d['시간대구분'] // convert to number
        const regionCode = d['행정동코드']
        const totalPopulation = +d['총생활인구수'] // convert to number

        // Initialize an object for this region code if it doesn't exist
        if (!locationPopulation[regionCode]) {
          locationPopulation[regionCode] = {
            dateId: selectedDateId,
            population: Array(24).fill(0), // Initialize to an array of 24 zeros
          }
        }

        // Assign the population to the corresponding hour for this region
        locationPopulation[regionCode].population[
          timeCategory
        ] = totalPopulation
      })

      updateMapColors(selectedHour) // Update the map colors when a new date is selected
    })

    // Listen for changes in the input value
    d3.select('#colorScaleBar').on('input', (event) => {
      selectedHour = +event.target.value // update the selected hour
      updateMapColors(selectedHour)
    })
  })
})
