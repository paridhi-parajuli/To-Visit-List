
mapboxgl.accessToken = 'pk.eyJ1IjoicGFyaWRoaTEyIiwiYSI6ImNsaWMxcnRwejBnYXkzZG1ub21xbmxjdWcifQ.xfiUnCHe2s0IX5NeJ0qSxQ';
const map = new mapboxgl.Map({
container: 'map',
style: 'mapbox://styles/mapbox/streets-v12',
center: [-100.486052, 37.830348],
zoom: 3
});

// Global variables
let rows;
let pp;
let csvData;
let countyGeojson; 
let hoveredPolygonId = null;
// Load  data but need to find out the endpoint
function load_data( unit, id, year, ) {
  /**
 * This is a function that loads the required data from an API.
 * @param {string} unit - It represents the geological unit for which we want to load data, could be county or state.
 * @param {string}  id - It is the unique identifier of the geological unit selected.
 * @param {string} year - It is the year we want the data of.
 * @returns {object} returns the data from quering the api.
 **/

    fetch(`https://data.bls.gov/assets/geojson/${year}/state-county/${id}_${unit}.json`)
    .then(response => response.json())
    .then(data => {
    console.log("Data load sucessfull",data);
    })
    .catch(error => {
    console.error('Data not loaded', error);

  });
}
// Fetch the GeoJSON file
fetch('counties.geojson')
  .then(response => response.json())
  .then(data => {
    // Assign the GeoJSON data to the global variable
    countyGeojson = data;
    console.log(countyGeojson.features);
  })
  .catch(error => {
    console.error('Error fetching county GeoJSON:', error);
  });

// Fetching the locally available svi data
fetch('svi_interactive_map.csv')
.then(response => response.text())
.then(csvContent => {
// Split the CSV content by line breaks to get individual rows
 rows = csvContent.split('\n');
 console.log("svi csv loaded");
})
.catch(error => {
console.error('error at loading svi csv ', error);
});

function searchCSV(rows, searchCounty,searchState) {
    /**
 * This is a function that searches data corresonding to given county and state from the csv.
 * @param {object} rows - rows of the csv file.
 * @param {string}  searchCounty - Name of county.
 * @param {string} searchState - State Number.
 * @returns {object} returns filtered data.
 **/
 
    searchCounty = '"'+searchCounty +'"';
    searchState = '"'+searchState +'"';
  let filteredData= null;
  let stateName = null;
  for (let i = 1; i < rows.length; i++) {
    const rowData = rows[i].split(',');
    if((rowData[8] === searchCounty) && (rowData[4]==searchState)) {
      filteredData = rowData[13];
      stateName = rowData[6];
    }
  }
  return { svi: filteredData, st: stateName }
  }

map.on('load', ()=> {
    

  map.addSource('states', {
    'type':'geojson',
    'data': 'https://docs.mapbox.com/mapbox-gl-js/assets/us_states.geojson'
});
map.addLayer({
  'id':'state-boundaries',
  'type': 'line',
  'source':'states',
  'paint': {
      'line-color':'#627BC1',
      'line-width':1
  }
  });
  console.log("hi");
// adding color to the states
map.addLayer({
  'id': 'state-area',
  'type': 'fill',
  'source': 'states',
  'layout': {},
  'paint': {
  'fill-color': '#627BC1',
  'fill-opacity': [
  'case',
  ['boolean', ['feature-state', 'hover'], false],
  1,
  0.05
  ]
  }
  });
        
});

var pp1 = new mapboxgl.Popup({
  className: 'custom-popup-small',
  closeButton: false,
  closeOnClick: false
});
map.on("click","state-area",(e)=>{
    const clickedFeature = e.features[0];

    // Update the layer style to apply the raised effect
    map.setPaintProperty('state-area', 'fill-extrusion-height', [
      'match',
      ['id'],
      clickedFeature.id,
      0.5,  // Height for the clicked state
      0     // Default height for other states
    ]);

});
map.on('mousemove', 'state-area', (e) => {
  if (e.features.length > 0) {
    var currentPolygonId = e.features[0].id;

    if (hoveredPolygonId !== currentPolygonId) {
      if (hoveredPolygonId !== null) {
        map.setFeatureState(
          { source: 'states', id: hoveredPolygonId },
          { hover: false }
        );
        pp1.remove();
      }

      hoveredPolygonId = currentPolygonId;
      map.setFeatureState(
        { source: 'states', id: hoveredPolygonId },
        { hover: true }
      );

      pp1.setLngLat(e.lngLat)
        .setHTML(`<h4>${e.features[0].properties.STATE_NAME}</h4>`)
        .addTo(map);
    }
  }
});

map.on('mouseleave', 'state-area', () => {
  if (hoveredPolygonId !== null) {
    map.setFeatureState(
      { source: 'states', id: hoveredPolygonId },
      { hover: false }
    );
    pp1.remove();
  }
  hoveredPolygonId = null;
});

map.on("dblclick","state-area",(e)=>{
  e.preventDefault() // to avaoid the default zoom behavior
  pp1.remove();
  pp2= new mapboxgl.Popup({
    className: 'custom-popup-small',
    closeButton: false,
    closeOnClick: false
  });
  const stateId = e.features[0].properties.STATE_ID


  // Filter the county geojson data to get the counties within the clicked state
  const filteredCountyFeatures = countyGeojson.features.filter((feature) => {
    return feature.properties.STATEFP === stateId;
  });

  // Create a new geojson object for the filtered county features
  const countyGeojsonData = {
    type: 'FeatureCollection',
    features: filteredCountyFeatures
  };

  if (map.getLayer('county-borders')) {
    map.removeLayer('county-borders');
  }

  // Remove the existing "county-borders" source if it exists
  if (map.getSource('county-borders')) {
    map.removeSource('county-borders');
  }

  // Add a new layer for the county boundaries
  map.addLayer({
    id: 'county-borderss',
    type: 'line',
    source: {
      type: 'geojson',
      data: countyGeojsonData
    },
    paint: {
      'line-color': 'black',
      'line-width': 0.1
    }
  });
  map.addLayer({
    id: 'county-area',
    type: 'fill',
    source: {
      type: 'geojson',
      data: countyGeojsonData
    },
    paint: {
      'fill-color': 'black',
      'fill-opacity': [
      'case',
      ['boolean', ['feature-state', 'hover'], false],
      1,
      0.1
      ]
      }
  });
  map.on("click", "county-area" , (event)=>{
    pp = new mapboxgl.Popup({
      className: 'custom-popup'
    }).setLngLat(event.lngLat);
    let result = searchCSV(rows, event.features[0].properties.NAME +' County' , event.features[0].properties.STATEFP );
    pp.setHTML(`
    <h4> ${event.features[0].properties.NAME }, ${result.st }</h4>
    <p> SVI : ${result.svi}</p>
  `).addTo(map);

  });


});


