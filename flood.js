// ------- Configuration variables ------- 

var mapType = 'TERRAIN'; // Can be 'SATELLITE', 'HYBRID', 'ROADMAP', etc.

var damRadius = 3000; // Radius of the dam in meters
var damHeight = 30; // Maximum flood height in meters

var animationSteps = 8; // Number of animation steps for flood layers
var stepDelay = 2000; // Pause between steps in milliseconds
var floodLayerOpacity = 0.7; // Opacity of each flood layer
var floodColor = 'A1D8EB'; // Flood color

var sampleRegion = false; // Sample point or region
var sampleBufferRadius = 1000; // Radius of sample region


// ------- Working variables ------- 

var currentIndex = 0; // Start at the first water level
var marker = null; // To store the currently added marker
var currentButton = null; // To store the current "Continue" button
var isBuilding = false;
var transparentOverlay = null;
var isDesktop = true;
var bottomPanel = null;
var progressPanel = null;

var currentProgress = 0; // Track the current progress
var maxProgress = 100; // Define the maximum progress value

var fontSize = '18px';

// ------- Text ---------
var letterTitle = "Dear Citizen";

var introText = [
    "Welcome to the information platform.",
    "Please take a moment to select your home address on the map.",
    "This will allow us to provide information regarding upcoming developments in your area.",
    "Thank you for your participation!"
];
var buildText = [
    "We regret to inform you that your property is located in an area designated for a hydropower dam.",
    "As a result, your property will be subject to expropriation and submersion.",
    "Remember, this hydropower dam is essential for enhancing our renewable energy capabilities, and we thank you for your cooperation."
];

// ------- Initialize map ------- 

var progressColor = ee.Image([109, 127, 202]).toByte(); // Red color (RGB)
  var progressThumbnail = ui.Thumbnail({
    image: progressColor,
    params: {
      dimensions: '1x1', // Start with 1x1 pixel image
      format: 'png'
    },
    style: {
      height: '0px',
      width: '40px', // Start with 0 width
      padding: '0',
      position: 'bottom-left'
    }
  });


// -- Map styling -- 
var styles = {
    'Soft Blue':
        [
            {
                "featureType": "administrative",
                "elementType": "geometry",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "poi",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "poi.attraction",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "labels.icon",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "transit",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            }
        ]
};

Map.setOptions(mapType, styles); // Set the map type to satellite

// Function to create the full-screen overlay
function createModal(message, buttonLabel, buttonAction) {
    // Full-screen semi-transparent black panel
    var overlay = ui.Panel({
        layout: ui.Panel.Layout.absolute(),
        style: {
            backgroundColor: 'rgba(0, 0, 0, 0.2)', // Black with 50% opacity
            position: 'top-center',
            width: '100%',
            height: '100%',
            color: '000000',
        }
    });
    // Centered panel for text and button
    var centeredPanel = ui.Panel({
        widgets: [
            ui.Label(letterTitle, {
                fontSize: '24px',
                color: '000000',
                textAlign: 'center',
                margin: '0 0 0 0',

            })
        ]
        .concat( // Add the labels dynamically
            message.map(function (msg) {
                return ui.Label(msg, {
                    fontSize: fontSize,
                    color: '000000',
                    textAlign: 'left',
                    margin: '30px 0 0 0 '
                });
            })
        )
        .concat([
            ui.Button({
                label: buttonLabel,
                imageUrl: "https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsrounded/check/default/48px.svg",
    
                style: { height: '50px', stretch: 'none', margin: '40px auto 20px auto ',  backgroundColor : '#aadaee'},
                onClick: function () {
                    // Remove the overlay when the button is clicked
                    Map.remove(overlay);
                    // Trigger the button's action
                    buttonAction();
                }
            })
        ]),
        layout: ui.Panel.Layout.flow('vertical'),
        style: {
            position: 'top-center',
            padding: '30px',
            backgroundColor: 'FFFFFF', // White with slight opacity
            width: '400px',
            textAlign: 'center',
            margin: '10% 0 0 0 ',
            border : '5px solid #f0bb5f'

        }
    });

    // Add the centered panel to the overlay
    overlay.add(centeredPanel);

    // Add the overlay to the map
    Map.add(overlay);
}

function createBottomPanel(text, buttonIcon, buttonAction){
  
    // Remove the old bottom panel if any
    if (bottomPanel !== null) {
        Map.remove(bottomPanel);
    }

    // Bottom panel with the label
    bottomPanel = ui.Panel({
        widgets: [ui.Label(text, {
            fontSize: fontSize,
            color: '000000',
            textAlign: 'center',
            position: 'middle-left'
        })],
        layout: ui.Panel.Layout.flow('horizontal'),
        style: {
            position: 'bottom-center',
            padding: '8px',
            textAlign: 'center',
        }
    });
    if (buttonIcon !== null) {
        var button = ui.Button({
            imageUrl: "https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsrounded/" + buttonIcon + "/default/48px.svg",
            style: { fontSize: '20px', margin: '2px 10px 0px 0px', backgroundColor : '#aadaee'},
           
            onClick: buttonAction
        });
        bottomPanel.add(button);
        }

            Map.add(bottomPanel);



}
// ------- Progress Bar Implementation -------

// Create a single-pixel image with a specified color

// Function to create the progress bar
function createProgressBar(initialValue, maxValue) {
    // Initialize global variables
    currentProgress = initialValue || 0;
    maxProgress = maxValue || 100;

    // Create the progress thumbnail
    progressThumbnail = ui.Thumbnail({
        image: ee.Image([109, 127, 202]).toByte(), // PÅrogress bar color R, G ,B
        params: {
            dimensions: '1x1', // Start with 1x1 pixel
            format: 'png'
        },
        style: {
            height: (currentProgress / maxProgress) * 280 + 'px', // Scale height to current progress
            width: '40px', // Fixed width
            padding: '0',
            position: 'bottom-left',
            margin: (280 - (currentProgress / maxProgress) * 280) + 'px 0 0 0', // Adjust top margin dynamically

        }
    });

    // Create the progress panel
    var meterMax= ui.Panel({
        widgets: [ui.Label(damHeight + 'm', { fontSize: fontSize, color: '000000', textAlign: 'center' }),],
        layout: ui.Panel.Layout.flow('vertical'),
        style: {
            position: 'middle-right', // Position the panel at the middle-right of the map
            padding: '6px',
            width: '68px', // Fixed width
            textAlign: 'center'

        }
    });
    var meterMin= ui.Panel({
        widgets: [ui.Label('   0m', { fontSize: fontSize, color: '000000', textAlign: 'center' }),],
        layout: ui.Panel.Layout.flow('vertical'),
        style: {
            position: 'middle-right', // Position the panel at the middle-right of the map
            padding: '6px',
            width: '68px', // Fixed width
            textAlign: 'center'
        }
    });
    progressPanel = ui.Panel({
        widgets: [
            progressThumbnail,
        ],
        layout: ui.Panel.Layout.flow('vertical'),
        style: {
            position: 'middle-right', // Position the panel at the middle-right of the map
            height: '312px',
            padding: '14px',
        }
    });

    // Add the panel to the map
    Map.add(meterMax);
    Map.add(progressPanel);
    Map.add(meterMin)

}
// Function to update the progress bar
function updateProgressBar(newValue) {
    // Ensure newValue is within the range [0, 100]
    currentProgress = newValue;
    var targetHeight = (newValue/100)*280; // Scale to max height (280px)

    // Update the height of the progress bar
    var marginTop = (280 - (currentProgress / maxProgress) * 280) + 'px  0 0 0'
    progressThumbnail.style().set('height', targetHeight + 'px')
    progressThumbnail.style().set('margin', marginTop);
}

// ------- Usage -------


function start_building_process() {

    Map.clear();
    
    Map.setOptions(mapType, styles); // Set the map type to satellite
    Map.setCenter(0, 0, 2); // World view, zoomed out
    Map.setControlVisibility(false);
    isBuilding = false;
    currentIndex = 0;
    isBuilding = false;
    marker = null;
    transparentOverlay = null;
    bottomPanel = null;
    
    // Example usage of the overlay
    createModal(
        introText,
        'Ok',
        function () {
            print('Starting simulation...');
            createBottomPanel("Select your location of residence by clicking on the map" , null, function () {
                print('Starting simulation...');
            });

        });

    //  ------- UI  ------- 





    //  ------- UI Interactions ------- 

    function toggleTransparantOverlay(show) {

        if (show) {
            var transparentOverlay = ui.Panel({
                layout: ui.Panel.Layout.absolute(),
                style: {
                    backgroundColor: 'rgba(0, 0, 0, 0.0)', // Black with 50% opacity
                    width: '100%',
                    height: '100%',
                    padding: '0px',
                    color: '000000',
                    margin: '200px'
                }
            });

            // Add the overlay to the map
            Map.add(transparentOverlay);
        } else if (!show && transparantOverlay !== null) {

            Map.remove(transparentOverlay);
            transparentOverlay = null;

        }

    }

    // Map onClick event to generate the flood
    Map.onClick(function (coords) {
        if (!isBuilding) {

            // Create a bottom panel 
            createBottomPanel("Selected location", 'check', function () {

            if (bottomPanel !== null) {
                Map.remove(bottomPanel);
            }

            createModal(
              buildText,
              'Ok',
              function () {
                             generate_flood(coords);

            });


            });
            
            // Clear the previous marker if any
            if (marker !== null) {
                Map.remove(marker);
            }

                      
          // Define the center point using the provided coordinates
          var center = ee.Geometry.Point([coords.lon, coords.lat]);
          
          // Create a larger red circle to act as the marker
          marker = center.buffer(100);
          
          // Define the style for the marker (red fill and border)
          var markerStyle = {
            color: '#e39f28', // Border color
            fillColor: '#e39f28', // Fill color
            width: 2, // Border width
            opacity: 1 // Transparency of the marker
          };
          
          // Add the marker to the map with the desired style
          Map.addLayer(marker, markerStyle, 'Marker');
          
          // Center the map on the new location and zoom in
          Map.centerObject(center, 13);

        }

    });



    //  ------- Main functions ------- 

    // Build dam-wall

    function build_dam_wall(center, dam_radius) {

        createBottomPanel("Building dam wall", null);
        var dam_wall_boundary = center.buffer(damRadius + 70);
        var dam_outline = ee.Image().byte().paint({
            featureCollection: ee.FeatureCollection([ee.Feature(dam_wall_boundary)]),
            color: 0,
            width: 10 // Set the border width to 5 pixels
        }).visualize({
            palette: ['e39f28'], // Dam wall color
            opacity: 1.0 // Full opacity for the border
        });
        Map.addLayer(dam_outline, {}, 'Dam Outline');

    }

    // Generate flood


    function generate_flood(coords) {

        // Set is building flag to ture to aviod user interfearing  
        isBuilding = true;

        createProgressBar(0, 100);

        // Create a transparant overlay to disable user input
        toggleTransparantOverlay(true);

        // get lat long from coordinate object
        var latitude = coords.lat;
        var longitude = coords.lon;

        // Create center point for flood
        var center = ee.Geometry.Point([longitude, latitude]);

        // Create buffer for dam
        var dam_boundary = center.buffer(damRadius);

        // Build dam walls
        build_dam_wall(center);


        //--- NASA DEM (no data north of OSLO) ---
        //var dem = ee.Image("USGS/SRTMGL1_003");
        //var elevation_layer = 'elevation'
        
        // Load DEM
        var dem = ee.Image("projects/sat-io/open-datasets/ASTER/GDEM");
        var elevation_layer = 'b1'

        
        var elevation = dem.clip(dam_boundary); // Clip to the dam's boundary

        if (! sampleRegion){
          // sample point for height reference
          var sampleElevation = dem.sample({ region: center, scale: 30 }).first();
          var localElevation = ee.Number(sampleElevation.get(elevation_layer)); // Extract elevation as a Number
        // Convert the localElevation scalar value to a valid type (Float) for use in further calculations

          localElevation = localElevation.toFloat(); // Convert to Float (this ensures it's a valid number)

        } else {
          // sample region for height reference
          
          // Define a buffer around the center point
          var sample_buffer = center.buffer(sampleBufferRadius);
          
          // Calculate the median elevation within the buffer
          var stats = dem.reduceRegion({
              reducer: ee.Reducer.median(), // Use the median reducer
              geometry: sample_buffer,       // The buffer area
              scale: 30,                   // Resolution of the DEM (e.g., 30m for SRTM)
              maxPixels: 1e8,              // Allow for a large number of pixels to process
              tileScale: 16                // Helps avoid memory issues for large areas
          });
          
          // Extract the median elevation value
          var medianElevation = ee.Number(stats.get(elevation_layer));
          
          // Safeguard: Check if the median elevation is valid
          if (medianElevation === null) {
              print("Error: Median elevation could not be calculated. Falling back to 0 meters.");
              medianElevation = ee.Number(0); // Fallback to sea level
          }
          
          // Convert the median elevation to an ee.Image for use in further calculations
          localElevation = ee.Image.constant(medianElevation);
          
                    
        }


        // Convert the localElevation to an ee.Image object
        localElevation = ee.Image.constant(localElevation); // Now it's an image with the correct type

        // Generate Pre-computed Flood Layers (Server-side Calculation)
        var waterLevels = ee.List.sequence(0, damHeight, damHeight / animationSteps); // Generate water levels from 0 to max height

        // Precompute flood layers based on local elevation
        var floodLayers = waterLevels.map(function (waterLevel) {
            // Calculate the relative water level by subtracting the local elevation from the water level
            var relativeWaterLevel = ee.Image.constant(waterLevel).add(localElevation); // Subtract the local elevation

            // Create flooded area by checking if the elevation is less than or equal to the relative water level
            var floodedArea = dem.lte(relativeWaterLevel); // Mask flooded area based on adjusted water level

            // Apply transparency by adjusting the alpha channel
            return floodedArea.updateMask(floodedArea).visualize({
                min: 0,
                max: 1, // Value range: 0 for dry, 1 for flooded area
                palette: ['00FFFF', floodColor], // Blue to Cyan color palette
                opacity: floodLayerOpacity // Set the opacity based on the water level
            }).clip(dam_boundary); // Clip to the dam's boundary
        });

        var currentLayer;
        // Function to add flood layers and update text sequentially
        function addFloodLayerWithDelay() {
            // Get the current water level and corresponding flood layer
            var level = waterLevels.get(currentIndex);
            var floodLayer = ee.Image(floodLayers.get(currentIndex)); // Get the flood layer at the current water level

            if (currentLayer != null) {
                currentLayer.setShown(true);
            }

            // Add the flood layer to the map
            currentLayer = Map.addLayer(floodLayer, {}, 'Flooded Area at Water Level: ' + level.getInfo() + 'm', false);


            // Move to the next layer
            currentIndex++;

            var percent = (100/(animationSteps))*(currentIndex-1)
            updateProgressBar(percent);
            if( currentIndex == 2){
              
              createBottomPanel("Flooding area", null);

              
            }
            // If we haven't reached the last water level, continue the process with a delay
            if (currentIndex < waterLevels.length().getInfo()) {
                
                // Update the progress bar

                // Introduce a small delay (e.g., 1000 ms = 1 second) before showing the next layer
                ui.util.setTimeout(addFloodLayerWithDelay, stepDelay);

            } else {
                
                createBottomPanel("Flood simulation completed", 'refresh', function () {
                    start_building_process();
                });

               


            }
        }

        // Start the process
        addFloodLayerWithDelay();
    }

}

// -------- Main loop -------



start_building_process();

