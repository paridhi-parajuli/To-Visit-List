// Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoicGFyaWRoaTEyIiwiYSI6ImNsaWMxcnRwejBnYXkzZG1ub21xbmxjdWcifQ.xfiUnCHe2s0IX5NeJ0qSxQ';

// Create the map instance
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/streets-v11', 
  center: [-96, 37.8], 
  zoom: 3 
});

// Variables for document objects
let toVisit = document.getElementById("toVisit");
let inputCity = document.getElementById("inputCity");
let addCity = document.getElementById("addCity");

// Add button functionality
addCity.addEventListener("click", function(){
    //Create a dynamic list item tag
    var listCity = document.createElement("li");
    // Write some content
    listCity.textContent = inputCity.value;
    // add styling to text as mentioned in css
    listCity.classList.add('item-styling');
    // append the item object to the container
    toVisit.appendChild(listCity);
    //reset the input field
    inputCity.value ="";

    // Draw a marker when you visit a city
    listCity.addEventListener("click", function(){
        // Cut the city name
        listCity.style.textDecoration = "line-through";
        listCity.style.textDecorationColor="green";

        // Making HTTP GET request to the URL along with our visited city name and access token of the api
        fetch('https://api.mapbox.com/geocoding/v5/mapbox.places/' + encodeURIComponent(listCity.textContent) + '.json?access_token=' + mapboxgl.accessToken)
        // parse the response object from fetch  as JSON and return a promise that resolves to the parsed JSON data.
        .then(function(response) {
          return response.json();
        })
        .then(function(data) {
          if (data.features && data.features.length > 0) {
            var location = data.features[0].center; // Extract the coordinates from the API response
            console.log("lat lon calc ma aayo")
            var lng = location[0]; // Longitude
            var lat = location[1]; // Latitude
            console.log(lat,lng, listCity.textContent)
  
            // Add a marker at the location
            var marker = new mapboxgl.Marker().setLngLat([lng,lat]).addTo(map);
          } else {
            console.log('City not found.');
          }
        })
        .catch(function(error) {
          console.log('Error:', error);})


    })

})

// Add the tile layer (map tiles)
// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//   attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
//   maxZoom: 18,
// }).addTo(map);

// Optionally, you can add markers or other map elements to customize the map

// Example marker
//L.marker([39.8283, -98.5795]).addTo(map).bindPopup('United States');

// // Example polygon (e.g., for state boundaries)
// var polygon = L.polygon([
//   [33, -118],
//   [33, -85],
//   [49, -85],
// ]).addTo(map);

// Fit the map view to the polygon bounds
// map.fitBounds(polygon.getBounds());