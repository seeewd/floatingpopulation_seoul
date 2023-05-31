document.addEventListener('DOMContentLoaded', function () {
  // Load and aggregate the data
  let locationPopulation = {}
  let minPopulation = 100
  let maxPopulation = 50000
  let selectedDateId = '20230401' // Initialize the selected date
  let selectedHour = 16 // Initialize the selected hour
  let selectedDong // Initialize the selected dong

  let ageRanges = [
    '0세부터9세',
    '10세부터14세',
    '15세부터19세',
    '20세부터24세',
    '25세부터29세',
    '30세부터34세',
    '35세부터39세',
    '40세부터44세',
    '45세부터49세',
    '50세부터54세',
    '55세부터59세',
    '60세부터64세',
    '65세부터69세',
    '70세이상',
  ]
  const ageLabels = {
    '0세부터9세': '0~9',
    '10세부터14세': '10~14',
    '15세부터19세': '15~19',
    '20세부터24세': '20~24',
    '25세부터29세': '25~29',
    '30세부터34세': '30~34',
    '35세부터39세': '35~39',
    '40세부터44세': '40~44',
    '45세부터49세': '45~49',
    '50세부터54세': '50~54',
    '55세부터59세': '55~59',
    '60세부터64세': '60~64',
    '65세부터69세': '65~69',
    '70세이상': '70~',
  }
  d3.csv('LOCAL_PEOPLE_DONG_202304_reduced.csv').then((data) => {
    data.forEach((d) => {
      const timeCategory = +d['시간대구분'] // convert to number
      const regionCode = d['행정동코드']
      const totalPopulation = +d['총생활인구수'] // convert to number
      const dateId = d['기준일ID'] // date from the dataset
      const man = +d['남자0세부터9세생활인구수']
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
        .domain([8000, 100000]) // min and max population values

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

          // Update selectedDong with the clicked region
          let selectedDong = d.properties.adm_cd2
          let message = document.querySelector('.right-container p')
          if (
            message &&
            message.textContent === '지도에서 지역을 선택해주세요'
          ) {
            message.remove()
          }
          // Update the bar charts with the new selectedDong
          updateMapColors(selectedHour, d.properties.adm_cd2)
          updateBarCharts(selectedDong)
          updateHeatmap(selectedDong)
        } else {
          // If it doesn't exist, log a default message
          console.log('No data for clicked feature code:', d.properties.adm_cd2)
        }
      }

      // Function to handle mouseover events
      // Create a D3 selection for the tooltip div

      // Function to handle mouseover events
      const handleMouseOver = (event, d) => {
        // Display the region's adm_nm in the regionInfo div
        d3.select('#regionInfo').text(d.properties.adm_nm)
      }

      // Function to handle mouseout events
      const handleMouseOut = (event, d) => {
        // Clear the regionInfo div
        d3.select('#regionInfo').text('Put your mouse on map')
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
      const updateMapColors = (hour, selectedDong) => {
        mapPaths.attr('fill', (d) => {
          const populationData = locationPopulation[d.properties.adm_cd2]
          if (populationData && populationData.population) {
            return colorScale(populationData.population[hour])
          } else {
            return '#ccc'
          }
        })

        if (selectedDong) {
          updateBarCharts(selectedDong)
        }
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

          // Set the population for the corresponding hour for this region
          locationPopulation[regionCode].population[
            timeCategory
          ] = totalPopulation
        })

        updateMapColors(selectedHour, selectedDong) // Update the map colors when a new date is selected
        updateBarCharts(selectedDong)
      })

      // Listen for changes in the input value
      d3.select('#colorScaleBar').on('input', (event) => {
        selectedHour = +event.target.value // update the selected hour
        updateMapColors(selectedHour, selectedDong)
      })
    })

    // Define the age ranges

    function createBarChart(svgId, data, ageRanges) {
      // Prepare the data for the bar chart
      console.log(data)
      let barChartData = data.map((item) => {
        return {
          ageRange: item.ageRange,
          male: item.male,
          female: item.female,
        }
      })

      console.log('createBarChart called with', { svgId, data, ageRanges })

      let svg = d3.select('#' + svgId)
      svg.selectAll('*').remove()

      if (svg.empty()) {
        console.error('No svg element found with id', svgId)
        return
      }
      console.log('barChartData:', barChartData)

      let margin = { top: 20, right: 20, bottom: 30, left: 40 }
      let width = +svg.attr('width') - margin.left - margin.right
      let height = +svg.attr('height') - margin.top - margin.bottom
      let g = svg
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

      // Set the scale for the X axis
      let xScale = d3
        .scaleBand()
        .rangeRound([0, width])
        .paddingInner(0.1)
        .domain(barChartData.map((d) => d.ageRange))

      // Set the scale for the Y axis
      let yScale = d3.scaleLinear().rangeRound([height, 0]).domain([0, 18000]) // Update this to consider both male and female populations
      g.append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .text((d) => ageLabels[d])

      // Draw the Y axis
      g.append('g').call(d3.axisLeft(yScale))
      let bars = g.selectAll('.bar').data(data).enter().append('g')

      bars
        .append('rect')
        .attr('class', 'bar male')
        .attr('x', (d) => xScale(d.ageRange))
        .attr('y', (d) => yScale(d.male))
        .attr('width', xScale.bandwidth() / 2) // half width for male bar
        .attr('height', (d) => height - yScale(d.male)) // height based on male population
        .attr('fill', 'blue') // color for male population

      bars
        .append('rect')
        .attr('class', 'bar female')
        .attr('x', (d) => xScale(d.ageRange) + xScale.bandwidth() / 2) // shift female bar to right
        .attr('y', (d) => yScale(d.female))
        .attr('width', xScale.bandwidth() / 2) // half width for female bar
        .attr('height', (d) => height - yScale(d.female)) // height based on female population
        .attr('fill', 'pink') // color for female population
    }
    function updateBarCharts(selectedDong) {
      if (selectedDong) {
        // Filter the data based on the selected dong, date and hour
        let selectedData = data.filter(
          (d) =>
            d['행정동코드'] === selectedDong &&
            d['기준일ID'] === selectedDateId &&
            +d['시간대구분'] === selectedHour,
        )

        let populationData = []
        ageRanges.forEach((agefield) => {
          let malePopulationFieldName = `남자${agefield}생활인구수`
          let femalePopulationFieldName = `여자${agefield}생활인구수`
          let maleTotalPopulation = d3.sum(
            selectedData,
            (d) => +d[malePopulationFieldName],
          )
          let femaleTotalPopulation = d3.sum(
            selectedData,
            (d) => +d[femalePopulationFieldName],
          )
          populationData.push({
            ageRange: agefield,
            male: maleTotalPopulation,
            female: femaleTotalPopulation,
          })
        })

        // Create the bar charts
        createBarChart('barChart', populationData, ageRanges)
      }
    }
    function createHeatmap(svgId, data, timeList, ageList) {
      let svg = d3.select('#' + svgId)
      svg.selectAll('*').remove()

      let margin = { top: 20, right: 20, bottom: 30, left: 40 }
      let width = +svg.attr('width') - margin.left - margin.right
      let height = +svg.attr('height') - margin.top - margin.bottom

      let g = svg
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

      // Scale for the X axis
      let xScale = d3
        .scaleBand()
        .range([0, width])
        .domain(ageList)
        .padding(0.05)

      g.append('g')
        .style('font-size', 10)
        .attr('transform', 'translate(0,' + height + ')')
        .call(
          d3
            .axisBottom(xScale)
            .tickFormat(function (d) {
              return ageLabels[d] // This will replace the tick with the value from ageLabels
            })
            .tickSize(0),
        )
        .select('.domain')
        .remove()

      // Scale for the Y axis
      let yScale = d3
        .scaleBand()
        .range([height, 0])
        .domain(timeList)
        .padding(0.05)

      g.append('g')
        .style('font-size', 15)
        .call(d3.axisLeft(yScale))
        .select('.domain')
        .remove()

      // Build color scale
      let colorScale = d3
        .scaleSequential()
        .interpolator(d3.interpolateYlGnBu)
        .domain([100, 10000]) // This would ideally be dynamic based on your data

      g.selectAll()
        .data(data, function (d) {
          return d.age + ':' + d.time
        })
        .enter()
        .append('rect')
        .attr('x', function (d) {
          return xScale(d.age)
        })
        .attr('y', function (d) {
          return yScale(d.time)
        })
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .style('fill', function (d) {
          return colorScale(d.value)
        })
    }

    function updateHeatmap(selectedDong) {
      console.log(selectedDong)
      if (selectedDong) {
        // Filter the data based on the selected dong, date and hour
        let selectedData = data.filter(
          (d) =>
            d['행정동코드'] === selectedDong &&
            d['기준일ID'] === selectedDateId,
        )

        let heatmapData = []
        let timeList = Array.from({ length: 24 }, (_, i) => i) // This creates an array [0, 1, 2, ..., 23]
        let ageList = []

        timeList.forEach((time) => {
          ageRanges.forEach((agefield) => {
            let malePopulationFieldName = `남자${agefield}생활인구수`
            let femalePopulationFieldName = `여자${agefield}생활인구수`
            let selectedDataForHour = selectedData.filter(
              (d) => +d['시간대구분'] === time,
            )
            let totalPopulation = d3.sum(
              selectedDataForHour,
              (d) =>
                +d[malePopulationFieldName] + +d[femalePopulationFieldName],
            )

            heatmapData.push({
              time: time,
              age: agefield,
              value: totalPopulation,
            })

            if (!ageList.includes(agefield)) ageList.push(agefield)
          })
        })
        console.log('what', heatmapData, timeList)
        // Create the heatmap
        createHeatmap('heatmap', heatmapData, timeList, ageList)
      }
    }
  })
})

window.onload = function () {
  let selectedRegionElement = document.getElementById('selectedRegion')

  if (!selectedRegionElement) {
    let message = document.createElement('p')
    message.textContent = '지도에서 지역을 선택해주세요'
    message.style.textAlign = 'center'

    let container = document.querySelector('.upper-content')
    container.appendChild(message)
  }
}
