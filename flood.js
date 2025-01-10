// ------- Configuration variables ------- 

var mapType = 'TERRAIN'; // Can be 'SATELLITE', 'HYBRID', 'ROADMAP', etc.
var damRadius = 3000; // Radius of the dam in meters
var damHeight = 30; // Maximum flood height in meters
var animationSteps = 5; // Number of animation steps for flood layers
var fadeInDuration = 3000; // Pause between steps in milliseconds
var floodLayerOpacity = 0.7; // Opacity of each flood layer
var floodColor = 'A1D8EB'; // Flood color
var fontSizeDesktop = '24';

// ------- Working variables ------- 

var currentIndex = 0; // Start at the first water level
var marker = null; // To store the currently added marker
var currentButton = null; // To store the current "Continue" button
var isBuilding = false
var transparentOverlay = null;
var isDesktop = true;
var bottomPanel = null;
var progressPanel = null;
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
ui.root.onResize(ui.util.debounce(configLayout, 100));

function configLayout(deviceInfo) {

    if (!deviceInfo.is_desktop || deviceInfo.width < 900) {

        isDesktop = false;
        print("We are on mobile");

    } else {

        isDesktop = true;
        print("We are on desktop");
    }
}


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
            color: '000000'
        }
    });

    // Centered panel for text and button
    var centeredPanel = ui.Panel({
        widgets: [
            ui.Label('Dear Citizen', {
                fontSize: isDesktop ? '24px' : '12px',
                color: '000000',
                textAlign: 'center',
                margin: '0 0 0 0'
            }),
            ui.Label(message, {
                fontSize: isDesktop ? '18px' : '9px',
                color: '000000',
                textAlign: 'left',
                margin: '30px 0 0 0 '
            }),
            ui.Button({
                label: buttonLabel,
                imageUrl: "https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsrounded/check/default/48px.svg",

                style: { height: '50px', stretch: 'both', margin: '40px 0 20px 0 ' },
                onClick: function () {
                    // Remove the overlay when the button is clicked
                    Map.remove(overlay);
                    // Trigger the button's action
                    buttonAction();
                }
            })
        ],
        layout: ui.Panel.Layout.flow('vertical'),
        style: {
            position: 'top-center',
            padding: '30px',
            backgroundColor: 'FFFFFF', // White with slight opacity
            width: '400px',
            textAlign: 'center',
            margin: '10% 0 0 0 '
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
            fontSize: '20px',
            color: '000000',
            textAlign: 'center',
            position: 'middle-left'
        })],
        layout: ui.Panel.Layout.flow('horizontal'),
        style: {
            position: 'bottom-center',
            padding: '20px',
            textAlign: 'center',
        }
    });
    if (buttonIcon != null) {
        var button = ui.Button({
            imageUrl: "https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsrounded/" + buttonIcon + "/default/48px.svg",
            style: { fontSize: '20px' },
            onClick: buttonAction
        });
        bottomPanel.add(button);
        }

            Map.add(bottomPanel);



}
// ------- Progress Bar Implementation -------

// Create a single-pixel image with a specified color (e.g., red)

// Function to create the progress bar
function createProgressBar(duration, steps) {

  var progress = 0; // Initial progress (0%)
  var maxProgress = 100; // Maximum progress (100%)
  var stepSize = maxProgress / steps; // Progress increment per step
  
  // Calculate the interval based on the total duration and the number of steps
  var interval = duration / steps; // Duration divided by number of steps
  
  // Initial thumbnail with 0% width
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

  // Tool panel to hold the progress bar
  
  progressPanel = ui.Panel({
    widgets: progressThumbnail,
    layout: ui.Panel.Layout.flow('horizontal'),
    style: {
      
    position: 'middle-right', // Position the panel at the top center
    height: '312px',
    padding: '6px',
    }

  });

  Map.add(progressPanel);

  // Function to update progress bar width
  function updateProgressBar() {
    // Increase progress
    progress += stepSize;

    // Calculate the new width of the progress bar (scaled to max width of 280px)
    var newHeight = (progress / maxProgress) * 280; // Scale to 280px max width
    progressThumbnail.style().set('height', newHeight + 'px');

    // Check if progress is complete
    if (progress < maxProgress) {
      // Continue updating progress with a delay
      ui.util.setTimeout(updateProgressBar, interval);
    } else {
      print('Progress complete!');
      Map.remove(progressPanel);
    }
  }

  // Start updating the progress bar
  updateProgressBar();
}

// ------- Usage -------


function start_building_process() {

    Map.clear();
    Map.setOptions(mapType, styles); // Set the map type to satellite
    Map.setCenter(0, 0, 2); // World view, zoomed out
    Map.setControlVisibility(false)
    isBuilding = false;

    // Example usage of the overlay
    createModal(
        'Please use the map to select you place of residence',
        'Ok',
        function () {
            print('Starting simulation...');
            createBottomPanel("Select your location of residence by clicking on the map" , function () {
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
        } else if (!show && transparantOverlay != null) {

            Map.remove(transparentOverlay)
            transparentOverlay = null

        }

    }

    // Map onClick event to generate the flood
    Map.onClick(function (coords) {
        if (!isBuilding) {

            // Create a bottom panel 
            createBottomPanel("Selected location", 'check', function () {
                generate_flood(coords);
            });
            
            // Clear the previous marker if any
            if (marker !== null) {
                Map.remove(marker);
            }

            
            var center = ee.Geometry.Point([coords.lon, coords.lat]);

            // Create a new marker at the selected location
            marker = Map.addLayer(center);

            // Center the map on the new location and zoom in
            Map.centerObject(center, 13);

        }

    });



    //  ------- Main functions ------- 

    // Build dam-wall

    function build_dam_wall(center, dam_radius) {

        createBottomPanel("Building dam wall");
        var dam_wall_boundary = center.buffer(damRadius + 50);
        var dam_outline = ee.Image().byte().paint({
            featureCollection: ee.FeatureCollection([ee.Feature(dam_wall_boundary)]),
            color: 0,
            width: 5 // Set the border width to 5 pixels
        }).visualize({
            palette: ['000000'], // Red color
            opacity: 1.0 // Full opacity for the border
        });
        Map.addLayer(dam_outline, {}, 'Dam Outline');

    }

    // Generate flood


    function generate_flood(coords) {

        // Set is building flag to ture to aviod user interfearing  
        isBuilding = true;

        if (currentButton !== null) {
            bottomPanel.remove(currentButton);
        }

        // Create a transparant overlay to disable user input
        toggleTransparantOverlay(true)

        // get lat long from coordinate object
        var latitude = coords.lat;
        var longitude = coords.lon;

        // Create center point for flood
        var center = ee.Geometry.Point([longitude, latitude]);

        // Create buffer for dam
        var dam_boundary = center.buffer(damRadius);

        // Build dam walls
        build_dam_wall(center)

        // Load Terrain Data (SRTM DEM)
        var dem = ee.Image("USGS/SRTMGL1_003");
        var elevation = dem.clip(dam_boundary); // Clip to the dam's boundary

        // Sample elevation at the center of the dam
        var sampleElevation = dem.sample({ region: center, scale: 30 }).first();
        var localElevation = ee.Number(sampleElevation.get('elevation')); // Extract elevation as a Number

        // Convert the localElevation scalar value to a valid type (Float) for use in further calculations
        localElevation = localElevation.toFloat(); // Convert to Float (this ensures it's a valid number)

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

        var currentLayer
        // Function to add flood layers and update text sequentially
        function addFloodLayerWithDelay() {
            // Get the current water level and corresponding flood layer
            var level = waterLevels.get(currentIndex);
            var floodLayer = ee.Image(floodLayers.get(currentIndex)); // Get the flood layer at the current water level

            if (currentLayer != null) {
                currentLayer.setShown(true)
                createBottomPanel("Flooded Area at Water Level: " + level.getInfo() + 'm');
            }

            // Add the flood layer to the map
            currentLayer = Map.addLayer(floodLayer, {}, 'Flooded Area at Water Level: ' + level.getInfo() + 'm', false);


            // Move to the next layer
            currentIndex++;

            // If we haven't reached the last water level, continue the process with a delay
            if (currentIndex < waterLevels.length().getInfo()) {
                
                // Create a progress bar with a 500ms interval and 20 steps
                createProgressBar(3000, 10);

                // Introduce a small delay (e.g., 1000 ms = 1 second) before showing the next layer
                ui.util.setTimeout(addFloodLayerWithDelay, fadeInDuration);

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

