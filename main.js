
let dropdown = document.getElementById("dropdown");
console.log(dropdown);
var mapContainer = document.getElementById('map');

// Set the dimensions of the map container
var containerWidth = mapContainer.clientWidth;
var containerHeight = mapContainer.clientHeight;


mapboxgl.accessToken = 'pk.eyJ1IjoicGFyaWRoaTEyIiwiYSI6ImNsaWMxcnRwejBnYXkzZG1ub21xbmxjdWcifQ.xfiUnCHe2s0IX5NeJ0qSxQ';
const map = new mapboxgl.Map({
container: 'map',
style: 'mapbox://styles/mapbox/streets-v12',
center: [-100.486052, 37.830348],
zoom: 2.5,
width: containerWidth,
height: containerHeight
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

function minMax(rows){
    minimum = 0
    maximum =500
}

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
        'line-color':'black',
        'line-width':0.4
    }
    });
    map.addLayer({
        id: 'state-base',
        type: 'fill',
        source: 'states',
        paint: {
          'fill-color': '#627BC1',
          'fill-opacity': 0.1
        }
      });
      
      // Raised layer (with raised effect)
      map.addLayer({
        id: 'state-raised',
        type: 'fill-extrusion',
        source: 'states',
        paint: {
          'fill-extrusion-color': '#627BC1',
          'fill-extrusion-height': 100,
          'fill-extrusion-opacity': 0.8
        },
        filter: ['==', 'STATE_ID', ''] // Initially empty filter
      });
    });

    map.on('click', 'state-base', (e) => {
        if (e.features.length > 0) {
          // Update the filter of the raised layer to show only the hovered polygon
          map.setFilter('state-raised', ['==', 'STATE_ID', e.features[0].properties.STATE_ID]);
        }
    




    map.on('click', 'state-raised',(e)=>{

        const stateId = e.features[0].properties.STATE_ID
        pp2= new mapboxgl.Popup({
            className: 'custom-popup-small',
            closeButton: false,
            closeOnClick: false
          });


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
      'line-width': 0.8,
      'line-opacity': 1
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
    });




var pp1 = new mapboxgl.Popup({
  className: 'custom-popup-small',
  closeButton: false,
  closeOnClick: false
});



map.on("click","state-area",(e)=>{
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


