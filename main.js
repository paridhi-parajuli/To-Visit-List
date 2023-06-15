mapboxgl.accessToken = 'pk.eyJ1IjoicGFyaWRoaTEyIiwiYSI6ImNsaWMxcnRwejBnYXkzZG1ub21xbmxjdWcifQ.xfiUnCHe2s0IX5NeJ0qSxQ';

var dropdown = document.getElementById("dropdown");
var mapContainer = document.getElementById('map');

const map = new mapboxgl.Map({
container: 'map-container',
style: 'mapbox://styles/mapbox/light-v11',
center: [-100.486052, 37.830348],
zoom: 3,
width: 100,
height: 300,
});

function preprocess(){

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
        'line-width':0.4,
        'line-opacity':0.5
    }
    });
    map.addLayer({
        id: 'state-area',
        type: 'fill',
        source: 'states',
        paint: {
          'fill-color': '#627BC1',
          'fill-opacity': 0.1
        }
      });
    map.addSource('counties', {
        type: 'geojson',
        data: 'counties.geojson'
      });
    map.addLayer({
        id: 'county-border',
        type: 'line',
        source: 'counties',
        paint: {
          'line-color': 'red',
          'line-opacity': 1
        },
        filter: ['==', 'STATE_ID', ''] 
    });

    map.addLayer({
        id: 'county-area',
        type: 'fill',
        source: 'counties',
        paint: {
          'fill-color': 'white',
          'fill-opacity': 0.3
        },
        filter: ['==', 'STATEFP', ''] 
      });

});
let selectedStateIds = [];
let legend = document.createElement('div');
legend.id = 'legend';
// CSS styles for the legend
legend.style.position = 'absolute';
legend.style.bottom = '20px';
legend.style.left = '20px';
legend.style.background = '#fff';
legend.style.padding = '10px';
legend.style.border = '1px solid #000';
legend.style.fontFamily = 'Arial, sans-serif';
legend.style.fontSize = '12px';
legend.style.lineHeight = '1.5';
legend.style.zIndex = '1';

var minCountyFP;
var maxCountyFP

map.on('click', 'state-area', (e)=>{
    const stateId = e.features[0].properties.STATE_ID;
    const stateFeature = e.features[0];

    if (stateId in selectedStateIds) {
      // If the same state is clicked again, do nothing or later change to reset the state.
      return;
    }
    else {
        selectedStateIds.push(stateId);
        map.setFilter('county-area', ['in', 'STATEFP', ...selectedStateIds]);
        map.setPaintProperty('state-boundaries', 'line-color', ['case',['in', ['get', 'STATE_ID'], ['literal', selectedStateIds]], 'black', 'black']);
        map.setPaintProperty('state-boundaries', 'line-width', ['case',['in', ['get', 'STATE_ID'], ['literal', selectedStateIds]], 1.5, 0.5]);
        map.setPaintProperty('state-boundaries', 'line-opacity', ['case',['in', ['get', 'STATE_ID'], ['literal', selectedStateIds]], 1, 0.6]);

        const countyFeatures = map.querySourceFeatures('counties').filter((feature) =>
        selectedStateIds.includes(feature.properties.STATEFP)
        );

        // Find the minimum and maximum COUNTYFP values for scaling the color range
        minCountyFP = Math.min(...countyFeatures.map((feature) => parseInt(feature.properties.COUNTYFP)));
        maxCountyFP = Math.max(...countyFeatures.map((feature) => parseInt(feature.properties.COUNTYFP)));

        // Update the county-area layer with the color based on the COUNTYFP values
        map.setPaintProperty('county-area', 'fill-color', [
            'interpolate',
            ['linear'],
            ['to-number', ['get', 'COUNTYFP']],
            minCountyFP,
            'blue', // Replace with your desired color for the lowest COUNTYFP value
            maxCountyFP,
            'red', // Replace with your desired color for the highest COUNTYFP value
        ]);
}
legend.innerHTML = `
<h10> Legend: ${dropdown.value} </h10> 
<div class="legend-item">
    <div class="legend-color" style="background-color: blue;"></div>
    <div class="legend-label">${minCountyFP}</div>
  </div>
  <div class="legend-item">
    <div class="legend-color" style="background-color: red;"></div>
    <div class="legend-label">${maxCountyFP}</div>
  </div>`;





  



























    // const stateId = e.features[0].properties.STATE_ID;
    // const filteredCountyFeatures = countyGeojson.features.filter((feature) => {
    //     return feature.properties.STATEFP === stateId;
    //   });
    // const countyGeojsonData = {
    //     type: 'FeatureCollection',
    //     features: filteredCountyFeatures
    //   };
    // map.addLayer({
    // id: 'county-borders',
    // type: 'line',
    // source: {
    //     type: 'geojson',
    //     data: countyGeojsonData
    // },
    // paint: {
    //     'line-color': 'black',
    //     'line-width': 0.4,
    //     'line-opacity': 1
    // }
    // });
    // map.addLayer({
    //     id: 'county-area',
    //     type: 'fill',
    //     source: {
    //       type: 'geojson',
    //       data: countyGeojsonData
    //     },
    //     paint: {
    //       'fill-color': 'black',
    //       'fill-opacity': [
    //       'case',
    //       ['boolean', ['feature-state', 'hover'], false],
    //       1,
    //       0.1
    //       ]
    //       }
    //   });

});

map.getContainer().appendChild(legend);



