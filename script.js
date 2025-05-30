let locations = [];
let currentLocationIndex = 0;
let map;
let directionsService;
let directionsRenderer;
let userMarker;
let navigationStack = []; // Stack to track navigation history

// Define the navigation sequence
const navigationSequence = {
  "intro-screen": null,
  "transportation-page": "intro-screen",
  "start-page": "transportation-page",
  "cycle-start-page": "transportation-page",
  "car-start-page": "transportation-page",
  "chapter-selection-page": "start-page",
  "chapter-page": "chapter-selection-page",
  "arrival-page": "chapter-page",
  "settings-page": null // Will be set dynamically
};

// Define chapter images with correct relative paths
const chapterImages = {
  '1': 'assets/images/Chapters/father-ted-house.jpg',
  '2': 'assets/images/Chapters/st-kevins-stump.jpg',
  '3': 'assets/images/Chapters/aillwee-cave.jpg',
  '4': 'assets/images/Chapters/kilfenora-village.jpg',
  '5': 'assets/images/Chapters/cliffs-of-moher.jpg',
};

// Define chapter data with distances, durations, and difficulty
const chapterData = {
  "1": {
    title: "Father Ted's House",
    description: "Begin your journey at the iconic parochial house where Father Ted, Dougal, and Jack lived.",
    narrative: "Ted wakes up to find the Holy Stone (which was being stored very securely in a biscuit tin under Father Jack's chair) has vanished. The only remains are an empty biscuit tin, and Dougal remembers seeing a very \"cool-looking priest\" in the night, but also says he might have dreamed it.",
    arrivalText: "Finish Chapter",
    location: { lat: 52.9719, lng: -9.4264 },
    image: "assets/images/Chapters/father-ted-house.jpg",
    distance: "Starting Point",
    duration: {
      car: "Starting Point",
      bike: "Starting Point"
    },
    difficulty: "Easy"
  },
  "2": {
    title: "St Kevin's Stump",
    description: "St. Kevin's Stump, which was basically a tree stump, is no longer here, but you will find the Rock that Ted and Dougal climbed.",
    narrative: "By the rock, a local man reports seeing a \"young priest with an earring\" listening to Oasis. Ted finds a flyer wedged in the stump for a \"Pop-Up Priest Rave & Blessing Session\" hosted in Aillwee Cave.",
    arrivalText: "Finish Chapter",
    location: { lat: 52.9719, lng: -9.4264 },
    image: "assets/images/Chapters/st-kevins-stump.jpg",
    distance: "45km",
    duration: {
      car: "35 minutes",
      bike: "2.5 hours"
    },
    difficulty: "Moderate"
  },
  "3": {
    title: "Aillwee Cave",
    description: "The caves appear in the Father Ted episode 'The Mainland' under the name 'The Very Dark Caves'.",
    narrative: "In the depths of Aillwee Cave (The Very Dark Caves), Ted and Dougal get lost (it's very dark), but Dougal finds a receipt near the entrance. Someone too badass to use a bin, perhaps?",
    arrivalText: "Finish Chapter",
    location: { lat: 53.0719, lng: -9.3264 },
    image: "assets/images/Chapters/aillwee-cave.jpg",
    distance: "38km",
    duration: {
      car: "30 minutes",
      bike: "2 hours"
    },
    difficulty: "Hard"
  },
  "4": {
    title: "Kilfenora Village",
    description: "Kilfenora Village is where you'll find Mrs. O'Reilly's house, Pat Mustard's milk route, and the pub where Ted met the Chinese community.",
    narrative: "Inside Vaughan's pub, Ted asks the bartender if he's seen the Holy Stone. The bartender shrugs: \"Yeah, a priest came in this morning with some kind of stone. Claimed it was blessed and tried to trade it for my leather jacket. He said, 'I'd rather throw it in the sea than give it back to those eejits.'\"",
    arrivalText: "Finish Chapter",
    location: { lat: 52.9719, lng: -9.4264 },
    image: "assets/images/Chapters/kilfenora-village.jpg",
    distance: "42km",
    duration: {
      car: "35 minutes",
      bike: "2.25 hours"
    },
    difficulty: "Moderate"
  },
  "5": {
    title: "Cliffs of Moher",
    description: "Experience the Cliffs of Moher and Moher Tower, featured in the 'Tentacles of Doom' episode.",
    narrative: "Ted and Dougal arrive breathless, but they're too late. A crowd witnessed a priest launch the stone into the crashing waves below. The priest is gone too. Something about this seems all too familiar. Bishop Brennan is calling. He wants answers. Who stole the Holy Stone of Clonrichert?",
    arrivalText: "Finish Chapter",
    location: { lat: 52.9719, lng: -9.4264 },
    image: "assets/images/Chapters/cliffs-of-moher.jpg",
    distance: "35km",
    duration: {
      car: "25 minutes",
      bike: "1.75 hours"
    },
    difficulty: "Hard"
  }
};

// Function to set chapter images
function setChapterImage(chapterId) {
  const chapterImageElement = document.getElementById('chapter-image');
  if (chapterImages[chapterId]) {
    const imagePath = chapterImages[chapterId];
    console.log(`Loading image: ${imagePath}`); // Debugging log

    // Set the image source immediately
    chapterImageElement.src = imagePath;
    chapterImageElement.alt = `Chapter ${chapterId} Image`;
    chapterImageElement.style.display = 'block'; // Ensure the image is visible
  } else {
    console.error(`Image not found for chapter: ${chapterId}`);
    chapterImageElement.style.display = 'none'; // Hide the image if not found
  }
}

// Example usage: Call this function when loading a chapter
document.addEventListener('DOMContentLoaded', () => {
  const chapterButtons = document.querySelectorAll('.chapter-button');
  chapterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const chapterId = button.getAttribute('data-chapter');
      setChapterImage(chapterId);
    });
  });
});

// Update AppState object
const AppState = {
  completedChapters: new Set(),
  progress: 0,
  
  init() {
    console.log('Initializing AppState...');
    this.completedChapters.clear();
    this.progress = 0;
    
    try {
      const saved = localStorage.getItem('appState');
      if (saved) {
        const state = JSON.parse(saved);
        this.completedChapters = new Set(state.completedChapters.map(String));
        this.progress = Math.min(100, this.completedChapters.size * 20);
        console.log('Loaded state:', { 
          completedChapters: Array.from(this.completedChapters), 
          progress: this.progress 
        });
      }
    } catch (e) {
      console.error('Error loading state:', e);
      this.completedChapters = new Set();
      this.progress = 0;
    }
    
    this.updateUI();
  },
  
  save() {
    console.log('Saving state...', { 
      completedChapters: Array.from(this.completedChapters), 
      progress: this.progress 
    });
    
    try {
      localStorage.setItem('appState', JSON.stringify({
        completedChapters: Array.from(this.completedChapters),
        progress: this.progress
      }));
    } catch (e) {
      console.error('Error saving state:', e);
      showError("Couldn't save progress. Please check your browser settings.");
    }
  },
  
  markChapterCompleted(chapterNum) {
    if (!chapterNum) return;
    
    const chapterStr = chapterNum.toString();
    console.log('Marking chapter as completed:', chapterStr);
    
    // Add to completed chapters
    this.completedChapters.add(chapterStr);
    
    // Update progress
    this.progress = Math.min(100, this.completedChapters.size * 20);
    console.log('New progress:', this.progress);
    
    // Save state immediately
    this.save();
    
    // Update UI
    this.updateUI();
    
    // Log current state for debugging
    console.log('Current state after completion:', {
      completedChapters: Array.from(this.completedChapters),
      progress: this.progress
    });
  },
  
  isChapterCompleted(chapterNum) {
    return this.completedChapters.has(chapterNum);
  },
  
  updateUI() {
    console.log('Updating UI with progress:', this.progress);
    
    // Update progress bar and text
    const progressFill = document.querySelector(".progress-fill");
    const progressText = document.querySelector(".progress-text");
    const caravanIcon = document.querySelector(".caravan-icon");
    
    if (progressFill) {
      progressFill.style.width = `${this.progress}%`;
      // Update color based on progress
      if (this.progress <= 20) {
        progressFill.style.background = "linear-gradient(90deg, #ff5252, #f44336, #d32f2f)"; // Red
      } else if (this.progress <= 40) {
        progressFill.style.background = "linear-gradient(90deg, #ffa726, #fb8c00, #f57c00)"; // Orange
      } else if (this.progress <= 60) {
        progressFill.style.background = "linear-gradient(90deg, #ffeb3b, #fdd835, #fbc02d)"; // Yellow
      } else {
        progressFill.style.background = "linear-gradient(90deg, #4CAF50, #43A047, #388E3C)"; // Green
      }
      
      // Update caravan position
      if (caravanIcon) {
        caravanIcon.style.left = `${this.progress}%`;
      }
    }
    
    if (progressText) {
      progressText.textContent = `${this.progress}%`;
      progressText.style.color = this.progress >= 50 ? '#fff' : '#2c3e50';
    }
    
    // Update chapter buttons
    updateChapterButtons();
    
    // Show completion message if all chapters are done
    const chapterSelectionPage = document.getElementById('chapter-selection-page');
    const existingMessage = chapterSelectionPage?.querySelector('.completion-message');
    
    if (this.progress >= 100) {
      if (chapterSelectionPage && !existingMessage) {
        const completionMessage = document.createElement('div');
        completionMessage.className = 'completion-message';
        completionMessage.innerHTML = `
          <h3>🎉 Congratulations! 🎉</h3>
          <p>All chapters of The Craggy Island Trail are now complete! You've had your fun, and that's all that matters.</p>
          <p>Have you figured out who the thief was?</p>
          <button class="share-button" onclick="shareApp()">Share</button>
        `;
        chapterSelectionPage.appendChild(completionMessage);
      }
    } else if (existingMessage) {
      existingMessage.remove();
    }
  }
};

// Function to share the app
function shareApp() {
  if (navigator.share) {
    navigator.share({
      title: 'Father Ted Trail',
      text: "I've completed the Father Ted Trail! Come explore Craggy Island with me!",
      url: window.location.href
    }).catch(console.error);
  } else {
    alert("Share functionality isn't supported on your device. But sure, isn't this great craic anyway?");
  }
}

// Update the loadProgress function
function loadProgress() {
  console.log('Loading progress...');
  AppState.init();
}

// Save progress to local storage
function saveProgress() {
  AppState.save();
}

// Function to switch between screens
function showScreen(screenId) {
  console.log(`Switching to screen: ${screenId}`);

  // If going to settings page, store the current screen
  if (screenId === 'settings-page') {
    const currentScreen = document.querySelector('.screen.active');
    if (currentScreen) {
      navigationSequence['settings-page'] = currentScreen.id;
    }
  }

  // Handle transportation page styling
  if (screenId === 'transportation-page') {
    const cycleTrailButton = document.querySelector('.transport-button.cycle-trail');
    const carTrailButton = document.querySelector('.transport-button.car-trail');
    
    // Check which mode is currently selected
    const isBikeMode = cycleTrailButton && cycleTrailButton.classList.contains('cycle-trail');
    
    if (cycleTrailButton && carTrailButton) {
      // Set initial white text for both buttons
      cycleTrailButton.style.color = 'white';
      carTrailButton.style.color = 'white';
      
      if (isBikeMode) {
        cycleTrailButton.style.backgroundColor = '#4CAF50'; // Green for selected
        carTrailButton.style.backgroundColor = '#212121'; // Much darker grey for unselected
      } else {
        carTrailButton.style.backgroundColor = '#4CAF50'; // Green for selected
        cycleTrailButton.style.backgroundColor = '#212121'; // Much darker grey for unselected
      }
    }
  }

  // Hide all screens
  document.querySelectorAll('.screen').forEach((screen) => {
    screen.classList.remove('active');
  });

  // Show the target screen
  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.classList.add('active');
    handleBackgroundMusic(screenId);
  } else {
    console.error(`Screen with ID "${screenId}" not found.`);
  }
}

// Load GeoJSON data for the selected chapter
function loadChapterData(chapterNumber) {
  console.log(`Loading chapter ${chapterNumber} data...`);
  
  // Reset locations array to clear previous chapter data
  locations = []; // Clear previous locations

  // Update chapter image
  const chapterImage = document.getElementById('chapter-image');
  if (chapterImage) {
    chapterImage.src = chapterImages[chapterNumber] || 'assets/images/default.jpg';
  }
  
  // Show loading state
  const mapDiv = document.getElementById('map');
  if (mapDiv) {
    mapDiv.innerHTML = '<div style="padding: 20px; text-align: center;">Loading map and location data...</div>';
  }
  
  // Initialize map first if not already initialized
  if (!map) {
    console.log('Initializing map...');
    initMap();
  }
  
  // Clear existing markers and directions
  if (window.markers) {
    console.log('Clearing existing markers...');
    window.markers.forEach(marker => marker.setMap(null)); // Remove markers from the map
  }
  window.markers = []; // Reset markers array
  if (directionsRenderer) {
    directionsRenderer.setDirections({routes: []});
  }

  // Load the GeoJSON file for this chapter using fetch with relative path
  const chapterFile = `assets/data/Chapter${chapterNumber}.geojson`;
  console.log(`Fetching GeoJSON from: ${chapterFile}`);
  
  fetch(chapterFile)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (!data || !data.features || data.features.length === 0) {
        throw new Error('No location data found for this chapter');
      }
      
      // Store new locations and explicitly set chapter number
      locations = data.features.map(feature => ({
        ...feature,
        properties: {
          ...feature.properties,
          chapterNumber: chapterNumber.toString()
        }
      }));
      currentLocationIndex = 0;
      
      console.log(`Found ${locations.length} locations for chapter ${chapterNumber}`);
      
      // Update chapter title and description
      updateChapterInfo(chapterNumber);
      
      // Add amenities section
      const chapterPage = document.getElementById('chapter-page');
      const existingAmenities = chapterPage.querySelector('.amenities-section');
      if (existingAmenities) {
        existingAmenities.remove();
      }
      
      const amenitiesSection = createAmenitiesSection(chapterNumber);
      if (amenitiesSection) {
        const mapElement = document.getElementById('map');
        if (mapElement && mapElement.parentNode) {
          mapElement.parentNode.insertBefore(amenitiesSection, mapElement);
        }
      }
      
      // Center map on first location before adding markers
      if (locations[0]) {
        const firstLocation = locations[0];
        const center = {
          lat: firstLocation.geometry.coordinates[1],
          lng: firstLocation.geometry.coordinates[0]
        };
        console.log('Centering map on:', center);
        if (map) {
          map.setCenter(center);
          map.setZoom(15);
        }
      }
      
      // Add markers to map
      addMarkersToMap();
      
      // Request location permission
      requestLocationPermission();
    })
    .catch(error => {
      console.error('Error loading chapter data:', error);
      showError(`Failed to load Chapter ${chapterNumber} data: ${error.message}`);
    });
}

// Function to update chapter information
function updateChapterInfo(chapterNumber) {
  console.log(`Updating chapter info for chapter ${chapterNumber}`);
  const data = chapterData[chapterNumber] || { 
    title: `Chapter ${chapterNumber}`, 
    description: "Description not available",
    narrative: "Narrative not available",
    arrivalText: "Arrival text not available",
    location: { lat: 0, lng: 0 },
    image: "assets/images/Chapters/default.jpg"
  };

  document.getElementById('chapter-number').textContent = `Chapter ${chapterNumber}`;
  document.getElementById('chapter-title').textContent = data.title;
  
  // Add transport mode info
  const transportMode = document.querySelector('.transport-button.cycle-trail') ? 'bike' : 'car';
  const durationInfo = chapterNumber === "1" ? "" : `Estimated duration: ${data.duration[transportMode]}`;
  const difficultyInfo = transportMode === 'bike' && data.difficulty && chapterNumber !== "1" ? ` | Trail difficulty: ${data.difficulty}` : '';
  
  const chapterDescription = document.getElementById('chapter-description');
  chapterDescription.innerHTML = `
    <p>${data.description}</p>
    <div class="chapter-info">
      ${chapterNumber === "1" ? "Starting Point" : `${durationInfo}${difficultyInfo}`}
    </div>
  `;
  chapterDescription.style.display = 'block';
  
  const chapterNarrative = document.getElementById('chapter-narrative');
  chapterNarrative.innerHTML = `
    <h3>Chapter Story</h3>
    <p>${data.narrative}</p>
  `;
  chapterNarrative.style.display = 'block';
  
  // Remove any existing amenities sections
  const existingAmenities = document.querySelectorAll('.amenities-section');
  existingAmenities.forEach(section => section.remove());
  
  // Add amenities section between chapter info and image
  const amenitiesSection = createAmenitiesSection(chapterNumber);
  if (amenitiesSection) {
    const chapterImage = document.getElementById('chapter-image');
    if (chapterImage && chapterImage.parentNode) {
      chapterImage.parentNode.insertBefore(amenitiesSection, chapterImage);
    }
  }
  
  document.getElementById('chapter-image').src = data.image;
  document.getElementById('im-here').textContent = data.arrivalText;
  
  console.log('Chapter info updated:', data);
}

// Initialize the map
function initMap() {
  try {
    console.log('Initializing map...');
    
    // Default center (Burren region)
    const defaultCenter = { lat: 52.9873, lng: -9.0767 };

    // Check if map div exists
    const mapDiv = document.getElementById("map");
    if (!mapDiv) {
      console.error('Map container not found!');
      return;
    }
    console.log('Map container found:', mapDiv);

    // Create map
    map = new google.maps.Map(mapDiv, {
    zoom: 12,
      center: defaultCenter,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    console.log('Map created:', map);

    // Initialize directions service and renderer
  directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: true
    });
    directionsRenderer.setMap(map);

    console.log('Map initialization complete');
    
    // If we have locations, add markers
    if (locations && locations.length > 0) {
      console.log('Adding initial markers...', locations);
      addMarkersToMap();
    } else {
      console.log('No locations available yet');
    }
  } catch (error) {
    console.error('Error initializing map:', error);
    showError('Failed to initialize map: ' + error.message);
  }
}

// Function to request location permission
function requestLocationPermission() {
  if (!navigator.geolocation) {
    showError("Your browser doesn't support geolocation. You won't be able to get directions.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      // Permission granted, start tracking
      startLocationTracking();
    },
    (error) => handleLocationError(error),
    {
      enableHighAccuracy: true,
      timeout: 30000, // Increased timeout to 30 seconds
      maximumAge: 5000
    }
  );
}

// Function to handle location errors
function handleLocationError(error) {
  let message = "";
  switch(error.code) {
    case error.PERMISSION_DENIED:
      message = "Location access was denied. You can enable it in your browser settings.";
      break;
    case error.POSITION_UNAVAILABLE:
      message = "Location information is unavailable. Please try again later.";
      break;
    case error.TIMEOUT:
      message = "Location request timed out. Retrying...";
      // Retry with less accurate but faster position
      navigator.geolocation.getCurrentPosition(
        (position) => startLocationTracking(),
        (error) => showError("Could not get your location. Please check your device settings."),
        {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 10000
        }
      );
      break;
    default:
      message = "An unknown error occurred getting your location.";
      break;
  }
  showError(message);
}

// Function to show errors
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.innerHTML = `
    <div style="background: rgba(255, 0, 0, 0.1); padding: 10px; border-radius: 5px; margin: 10px;">
      <p style="color: red; margin: 0;">${message}</p>
      <button onclick="this.parentElement.remove()" style="margin-top: 5px;">OK</button>
    </div>
  `;
  document.getElementById('map').appendChild(errorDiv);
}

// Function to start location tracking
function startLocationTracking() {
  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      if (!userMarker) {
        userMarker = new google.maps.Marker({
          position: userLocation,
          map: map,
          icon: {
            url: 'assets/images/caravan.png',
            scaledSize: new google.maps.Size(32, 32)
          },
          zIndex: 1000
        });
      } else {
        userMarker.setPosition(userLocation);
      }

      // Update directions if we have a current location target
      if (locations && locations.length > 0 && currentLocationIndex < locations.length) {
        const nextLocation = {
          lat: locations[currentLocationIndex].geometry.coordinates[1],
          lng: locations[currentLocationIndex].geometry.coordinates[0]
        };
        calculateAndDisplayRoute(userLocation, nextLocation);
      }
    },
    (error) => handleLocationError(error),
    {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 30000
    }
  );

  // Store watch ID to clear if needed
  window.locationWatchId = watchId;
}

// Function to add markers to the map
function addMarkersToMap() {
  console.log('Adding markers to map...');
  console.log('Number of locations:', locations.length);

  if (!locations || !locations.length || !map) {
    console.error('Missing locations or map object');
    showError('No locations available or map not initialized');
    return;
  }

  window.markers = []; // Reset markers array
  const bounds = new google.maps.LatLngBounds();
  
  locations.forEach((location, index) => {
    console.log(`Creating marker ${index + 1}:`, location);

    if (!location.geometry || !location.geometry.coordinates) {
      console.error('Invalid location data:', location);
      return;
    }

    const position = {
      lat: location.geometry.coordinates[1],
      lng: location.geometry.coordinates[0]
    };
    
    console.log(`Adding marker at position:`, position);

    const marker = new google.maps.Marker({
      position: position,
      map: map,
      title: location.properties.Name,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: location.properties.completed ? '#4CAF50' : '#FF5722',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      },
      label: {
        text: `${index + 1}`,
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: 'bold'
      }
    });

    // Create info window
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 15px; max-width: 250px;">
          <h3 style="margin: 0 0 10px 0; color: #4CAF50;">${location.properties.Name}</h3>
          <p style="margin: 0;">${location.properties.description}</p>
          ${location.properties.completed ? 
            '<p style="color: #4CAF50; margin-top: 10px;">✓ Visited</p>' : 
            ''}
        </div>
      `
    });

    marker.addListener('click', () => {
      // Close other info windows
      if (window.currentInfoWindow) {
        window.currentInfoWindow.close();
      }
      infoWindow.open(map, marker);
      window.currentInfoWindow = infoWindow;
      
      // Set current location and calculate route if user location available
      currentLocationIndex = index;
      if (userMarker) {
        calculateAndDisplayRoute(userMarker.getPosition(), position);
      }
    });

    window.markers.push(marker);
    bounds.extend(position);
    console.log(`Marker ${index + 1} added successfully`);
  });

  // Fit bounds with padding
  map.fitBounds(bounds, {
    padding: {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50
    }
  });
  
  console.log(`Added ${window.markers.length} markers to the map`);
}

// Function to calculate and display route
function calculateAndDisplayRoute(start, end) {
  console.log('Calculating route from', start, 'to', end);
  
  if (!directionsService || !directionsRenderer) {
    console.error('Directions service not initialized');
    showError('Navigation service not ready. Please try again.');
    return;
  }

  directionsService.route(
    {
      origin: start,
      destination: end,
      travelMode: google.maps.TravelMode.WALKING,
      optimizeWaypoints: true
    },
    (response, status) => {
      if (status === 'OK') {
        directionsRenderer.setDirections(response);
        
        // Update distance and estimated time
        const route = response.routes[0];
        const distance = route.legs[0].distance.text;
        const duration = route.legs[0].duration.text;
        
        // Update the UI with route information
        const routeInfo = document.createElement('div');
        routeInfo.className = 'route-info';
        routeInfo.innerHTML = `
          <div style="background: rgba(76, 175, 80, 0.1); padding: 10px; border-radius: 5px; margin-top: 10px;">
            <p style="margin: 0;"><strong>Distance:</strong> ${distance}</p>
            <p style="margin: 5px 0 0 0;"><strong>Walking time:</strong> ${duration}</p>
          </div>
        `;
        
        // Add route info to the description
        const description = document.getElementById('chapter-description');
        const existingRouteInfo = description.querySelector('.route-info');
        if (existingRouteInfo) {
          existingRouteInfo.remove();
        }
        description.appendChild(routeInfo);
      } else {
        console.error('Directions request failed:', status);
        showError('Could not calculate route. Please try again.');
      }
    }
  );
}

// Show interactive prompt
function showPrompt(scene) {
  document.getElementById("chapter-description").textContent = scene;
  showScreen("arrival-page");
}

// Back button handler
function handleBackButton() {
  const currentScreen = document.querySelector('.screen.active');
  if (!currentScreen) return;

  const previousScreen = navigationSequence[currentScreen.id];
  console.log(`Current screen: ${currentScreen.id}, Previous screen: ${previousScreen}`);

  if (previousScreen) {
    showScreen(previousScreen);
  } else {
    console.error('No previous screen defined for:', currentScreen.id);
  }
}

// Update the settings page "Back" button handler
document.addEventListener('DOMContentLoaded', () => {
  const backButton = document.querySelector('#settings-page #back-button');
  if (backButton) {
    backButton.addEventListener('click', handleBackButton);
  }
});

// Sound effects
const sounds = {
    locationReached: new Audio('assets/sounds/effects/location-reached.mp3'),
    chapter1Click: new Audio('assets/sounds/effects/Chapter-1-button-click.mp3'),
    chapter2Click: new Audio('assets/sounds/effects/Chapter-2-button-click.mp3'),
    chapter3Click: new Audio('assets/sounds/effects/Chapter-3-button-click.mp3'),
    chapter4Click: new Audio('assets/sounds/effects/Chapter-4-button-click.mp3'),
    chapter5Click: new Audio('assets/sounds/effects/Chapter-5-button-click.mp3')
};

// Function to play sound effect
function playSound(soundName) {
    const sound = sounds[soundName];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(error => console.log('Sound play failed:', error));
    }
}

// Update the handleLocationResponse function
function handleLocationResponse(isYes, chapterNumber) {
    const popup = document.querySelector('.popup-overlay');
    if (popup) popup.remove();
    
    if (isYes) {
        console.log('Marking chapter as completed:', chapterNumber);
        
        // Play location reached sound
        playSound('locationReached');
        
        // Ensure chapterNumber is a string
        const chapterStr = chapterNumber.toString();
        
        // Mark chapter as completed in AppState
        AppState.markChapterCompleted(chapterStr);
        
        // Update map markers
        if (window.markers && locations) {
            const markerIndex = locations.findIndex(loc => 
                loc.properties.chapterNumber === chapterStr
            );
            if (markerIndex >= 0 && window.markers[markerIndex]) {
                window.markers[markerIndex].setIcon({
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 12,
                    fillColor: '#4CAF50',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2
                });
            }
        }
        
        // Force update all UI elements
        AppState.updateUI();
        updateChapterButtons();
        
        // Show congratulations message
        showCongratulations(chapterStr);
    } else {
        showError("Keep exploring! You'll find it soon!");
    }
}

// Update chapter button click handlers
function initializeButtonHandlers() {
    console.log('Initializing button handlers...');
    
    // Start trail button handler
    const startTrailButton = document.getElementById('start-trail-button');
    if (startTrailButton) {
        console.log('Found start trail button');
        startTrailButton.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent any default behavior
            console.log('Start Trail button clicked');
            showScreen('chapter-selection-page');
        });
    }
    
    // Settings button handler - add to all instances
    document.querySelectorAll('#settings-button').forEach(button => {
        button.addEventListener('click', () => {
            console.log('Settings button clicked');
            showScreen('settings-page');
        });
    });

    // Back button handler - add to all instances
    document.querySelectorAll('#back-button').forEach(button => {
        button.addEventListener('click', handleBackButton);
    });

    // Transportation buttons handler
    const cycleTrailButton = document.querySelector('.transport-button.cycle-trail');
    const carTrailButton = document.querySelector('.transport-button.car-trail');
    
    if (cycleTrailButton) {
        cycleTrailButton.addEventListener('click', function() {
            console.log('Cycle Trail selected');
            // Remove car-trail class and add cycle-trail class
            document.querySelectorAll('.transport-button').forEach(btn => {
                btn.classList.remove('cycle-trail', 'car-trail');
            });
            this.classList.add('cycle-trail');
            showScreen('start-page');
            updateChapterButtons(); // Update buttons immediately
        });
    }
    
    if (carTrailButton) {
        carTrailButton.addEventListener('click', function() {
            console.log('Car Trail selected');
            // Remove cycle-trail class and add car-trail class
            document.querySelectorAll('.transport-button').forEach(btn => {
                btn.classList.remove('cycle-trail', 'car-trail');
            });
            this.classList.add('car-trail');
            showScreen('start-page');
            updateChapterButtons(); // Update buttons immediately
        });
    }

    // Chapter buttons handler
    document.querySelectorAll('.chapter-button').forEach(button => {
        button.addEventListener('click', function() {
            const chapterNum = this.getAttribute('data-chapter');
            if (!chapterNum) return;

            // Play chapter-specific sound effect
            playSound(`chapter${chapterNum}Click`);

            // Add started class
            this.classList.add('started');

            // Load chapter data and show chapter page
            loadChapterData(chapterNum);
            showScreen('chapter-page');
        });
    });

    // Update initial chapter states
    updateChapterButtons();
}

// Update the updateChapterButtons function
function updateChapterButtons() {
  console.log('Updating chapter buttons...');
  const isBikeMode = document.querySelector('.transport-button.cycle-trail') !== null;
  console.log('Transport mode:', isBikeMode ? 'bike' : 'car');
  
  document.querySelectorAll(".chapter-button").forEach(button => {
    const chapterNum = button.getAttribute('data-chapter');
    const isCompleted = AppState.isChapterCompleted(chapterNum);
    const data = chapterData[chapterNum];
    
    // Remove existing completion-related elements
    button.classList.remove('completed', 'started');
    let checkmark = button.querySelector('.completion-checkmark');
    if (checkmark) {
      checkmark.remove();
    }
    
    // Create new checkmark
    checkmark = document.createElement('span');
    checkmark.className = 'completion-checkmark';
    checkmark.textContent = '✓';
    button.appendChild(checkmark);
    
    // Update chapter content with distance and duration
    const chapterContent = button.querySelector('.chapter-content');
    if (chapterContent && data) {
      let infoContent = '';
      if (chapterNum === "1") {
        infoContent = `<div class="distance">Starting Point</div>`;
      } else {
        if (isBikeMode) {
          infoContent = `
            <div class="distance">${data.distance}</div>
            <div class="duration">${data.duration.bike}</div>
            <div class="difficulty" data-difficulty="${data.difficulty}">${data.difficulty}</div>
          `;
        } else {
          infoContent = `
            <div class="distance">${data.distance}</div>
            <div class="duration">${data.duration.car}</div>
          `;
        }
      }
      
      chapterContent.innerHTML = `
        <div class="chapter-title">Chapter ${chapterNum}: ${data.title}</div>
        <div class="chapter-info">
          ${infoContent}
        </div>
      `;
    }
    
    if (isCompleted) {
      button.classList.add('completed');
    } else if (button.classList.contains('started')) {
      button.classList.add('started');
    }
  });
}

// Helper function to get chapter titles
function getChapterTitle(chapterNumber) {
  const data = chapterData[chapterNumber];
  return data ? `Chapter ${chapterNumber}: ${data.title}` : `Chapter ${chapterNumber}`;
}

// Helper function to get chapter descriptions
function getChapterDescription(chapterNumber) {
  const descriptions = {
    "1": "Begin your journey at the iconic parochial house where Father Ted, Dougal, and Jack lived.",
    "2": "St. Kevin's Stump, which was basically a tree stump, is no longer here, but you will find the Rock that Ted and Dougal climbed.",
    "3": "The caves appear in the Father Ted episode 'The Mainland' under the name 'The Very Dark Caves'.",
    "4": "Kilfenora Village is where you'll find Mrs. O'Reilly's house, Pat Mustard's milk route, and the pub where Ted met the Chinese community.",
    "5": "Experience the Cliffs of Moher and Moher Tower, featured in the 'Tentacles of Doom' episode."
  };
  return descriptions[chapterNumber] || "Description not available";
}

// Test function to verify GeoJSON loading
function testChapterLoading() {
  console.log('Testing chapter loading...');
  
  // Test each chapter
  for (let i = 1; i <= 5; i++) {
    fetch(`./assets/data/Chapter${i}.geojson`)
      .then(response => response.json())
      .then(data => {
        console.log(`Chapter ${i} data:`, data);
        console.log(`Number of locations:`, data.features.length);
        console.log(`First location:`, data.features[0]);
      })
      .catch(error => {
        console.error(`Error loading Chapter ${i}:`, error);
      });
  }
}

// Chapter-specific location questions
const locationQuestions = {
  "1": "Can you see Father Ted's House? Where Mrs. Doyle made all that tea?",
  "2": "Can you see the rock? The one that Ted and Dougal climbed up on?",
  "3": "Are you at the very dark caves?",
  "4": "Can you see Vaughan's pub?",
  "5": "Can you see the mighty Cliffs of Moher?"
};

// Chapter-specific congratulation messages
const congratulationMessages = {
  "1": "One of Craggy Island's main attractions, St. Kevin's Stump, should be a good place to start looking for the culprit!",
  "2": "Perhaps Aillwee Cave is the best place to go next.. ",
  "3": "You're getting closer. Maybe it's best to follow the receipt to Kilfenora.",
  "4": "You're hot on the culprit's heels! Can you get to the Cliffs of Moher on time?",
  "5": "You've conquered the Cliffs of Moher! This should be your last stop. Have a cup of tea!"
};

// Add event listeners for navigation buttons
const getDirectionsBtn = document.getElementById("get-directions");
const imHereBtn = document.getElementById("im-here");

if (getDirectionsBtn) {
  getDirectionsBtn.addEventListener("click", () => {
    if (!locations || !locations[currentLocationIndex]) {
      showError("No location data available.");
      return;
    }

    const destination = {
      lat: locations[currentLocationIndex].geometry.coordinates[1],
      lng: locations[currentLocationIndex].geometry.coordinates[0]
    };

    // Open in Google Maps directly
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`, '_blank');
  });
}

if (imHereBtn) {
  imHereBtn.addEventListener("click", () => {
    if (!locations || !locations[currentLocationIndex]) {
      showError("No location data available.");
      return;
    }

    // Show verification popup immediately
    const chapterNum = locations[currentLocationIndex].properties.chapterNumber;
    showLocationVerification(chapterNum);
  });
}

// Function to show location verification popup
function showLocationVerification(chapterNumber) {
  const popup = document.createElement('div');
  popup.className = 'popup-overlay';
  popup.innerHTML = `
    <div class="popup-content">
      <h3>${locationQuestions[chapterNumber] || `Are you at Chapter ${chapterNumber}'s location?`}</h3>
      <div class="popup-buttons">
        <button class="popup-button yes" onclick="handleLocationResponse(true, '${chapterNumber}')">Yes, I'm here!</button>
        <button class="popup-button no" onclick="handleLocationResponse(false, '${chapterNumber}')">Not yet</button>
      </div>
    </div>
  `;
  document.body.appendChild(popup);
}

// Function to show congratulations popup
function showCongratulations(chapterNumber) {
  const popup = document.createElement('div');
  popup.className = 'popup-overlay';
  popup.innerHTML = `
    <div class="popup-content">
      <h3 class="congratulations">🎉 Congratulations! 🎉</h3>
      <p>${congratulationMessages[chapterNumber] || 'Well done on completing this chapter!'}</p>
      <button class="popup-button yes" onclick="handleCongratulations()">Continue</button>
    </div>
  `;
  document.body.appendChild(popup);
}

// Function to handle congratulations continuation
function handleCongratulations() {
  // Remove all popup overlays
  document.querySelectorAll('.popup-overlay').forEach(popup => popup.remove());
  
  // Return to chapter selection
  showScreen('chapter-selection-page');
}

// Helper function to count completed locations
function getCompletedLocations() {
  return locations.filter(loc => loc.properties.completed).length;
}

// Function to reset the trail
function resetTrail() {
    const popup = document.createElement('div');
    popup.className = 'popup-overlay';
    popup.innerHTML = `
        <div class="popup-content">
            <h3>Reset Trail</h3>
            <p>Are you sure you want to reset your trail progress? This will clear all completed chapters and start you from the beginning.</p>
            <div class="popup-buttons">
                <button class="popup-button yes" onclick="confirmResetTrail()">Yes, Reset</button>
                <button class="popup-button no" onclick="this.parentElement.parentElement.parentElement.remove()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(popup);
}

// Function to confirm trail reset
function confirmResetTrail() {
    // Clear completed chapters
    AppState.completedChapters.clear();
    AppState.progress = 0;
    AppState.save();
    AppState.updateUI();
    
    // Remove the popup
    document.querySelector('.popup-overlay').remove();
    
    // Show intro screen
    showScreen('intro-screen');
}

// Settings handlers
function initializeSettings() {
    const volumeSlider = document.getElementById('volume');
    const textSizeSlider = document.getElementById('text-size');
    const backgroundMusic = document.getElementById('background-music');
    
    // Load saved settings
    const savedVolume = localStorage.getItem('volume') || 1;
    const savedTextSize = localStorage.getItem('textSize') || 16;
    
    // Apply saved settings
    volumeSlider.value = savedVolume;
    textSizeSlider.value = savedTextSize;
    backgroundMusic.volume = savedVolume;
    document.documentElement.style.setProperty('--base-font-size', `${savedTextSize}px`);
    
    // Set initial slider colors
    updateSliderColors(volumeSlider, 'volume-value');
    updateSliderColors(textSizeSlider, 'text-size-value');
    
    // Add event listeners
    volumeSlider.addEventListener('input', (e) => {
        const value = e.target.value;
        // Update all audio elements
        document.querySelectorAll('audio').forEach(audio => {
            audio.volume = value;
        });
        localStorage.setItem('volume', value);
        updateSliderColors(volumeSlider, 'volume-value');
    });
    
    textSizeSlider.addEventListener('input', (e) => {
        const value = e.target.value;
        document.documentElement.style.setProperty('--base-font-size', `${value}px`);
        localStorage.setItem('textSize', value);
        updateSliderColors(textSizeSlider, 'text-size-value');
    });

    // Add reset trail button handler
    const resetTrailButton = document.getElementById('reset-trail-button');
    if (resetTrailButton) {
        resetTrailButton.addEventListener('click', resetTrail);
    }
}

// Helper function to update slider colors
function updateSliderColors(slider, variableName) {
  const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
  document.documentElement.style.setProperty(`--${variableName}`, `${value}%`);
}

// Function to show disclaimer - only called from settings page
function showDisclaimer() {
    const popup = document.createElement('div');
    popup.className = 'popup-overlay';
    popup.innerHTML = `
        <div class="popup-content">
            <h3>Disclaimer</h3>
            <p>
                This application is an independent academic project created as part of a Master's in Multimedia programme. 
                It is not affiliated with, endorsed by, or connected to Hat Trick Productions, Channel 4, or any official 
                rights holders of Father Ted. All references, visuals, and inspirations drawn from the series are used 
                purely for educational and research purposes. No copyright infringement is intended, and no commercial 
                gain is sought from this work.
            </p>
            <button onclick="this.parentElement.parentElement.remove()">Close</button>
        </div>
    `;
    document.body.appendChild(popup);
}

function hideDisclaimer() {
  document.getElementById('disclaimer-popup').style.display = 'none';
}

// Function to handle background music based on the active screen
function handleBackgroundMusic(screenId) {
  const backgroundMusic = document.getElementById('background-music');
  if (!backgroundMusic) return;

  // Play music on the intro, start, settings, chapter selection, and transportation pages
  if (screenId === 'intro-screen' || 
      screenId === 'start-page' || 
      screenId === 'settings-page' || 
      screenId === 'chapter-selection-page' ||
      screenId === 'transportation-page') {
    if (backgroundMusic.paused) {
      backgroundMusic.play().catch((error) => {
        console.error('Error playing background music:', error);
      });
    }
  } else {
    if (!backgroundMusic.paused) {
      backgroundMusic.pause();
    }
  }
}

// Ensure music starts immediately on the intro page
document.addEventListener('DOMContentLoaded', () => {
  const backgroundMusic = document.getElementById('background-music');
  if (backgroundMusic) {
    backgroundMusic.volume = 1; // Set volume
    backgroundMusic.play().catch((error) => {
      console.error('Error playing background music:', error);
    });
  }
  handleBackgroundMusic('intro-screen'); // Ensure music continues on other screens
});

// Ensure the correct text is displayed on the Start Trail page
document.addEventListener('DOMContentLoaded', () => {
  const startPageContent = document.querySelector('.start-page-content');
  if (startPageContent) {
    startPageContent.innerHTML = `
      <h2>Story Guide</h2>
      <div class="welcome-text">
        A shocking discovery has been made at Father Ted's house! The Holy Stone of Clonrichert has mysteriously vanished. The only evidence is Dougal's vague memory of seeing a "cool-looking priest" in the night. Bishop Brennan demands answers! 

        Can you help Father Ted track down the missing Holy Stone?
      </div>
      <img src="assets/images/trail-map.jpg" alt="Craggy Island Trail Map" class="trail-map">
    `;
  }
});

// Update the DOMContentLoaded event listener
document.addEventListener("DOMContentLoaded", () => {
  // Initialize basic functionality
  AppState.init();
  initializeButtonHandlers();
  
  // Show intro screen first
  showScreen('intro-screen');
  
  // Allow click to progress
  const introScreen = document.getElementById('intro-screen');
  if (introScreen) {
    introScreen.addEventListener('click', () => {
      console.log('Intro screen clicked');
      showScreen('transportation-page');
    });
  }

  // Add back button handlers
  document.querySelectorAll('#back-button').forEach(button => {
    button.addEventListener('click', handleBackButton);
  });
});

// Add CSS for chapter-selection-page title
const style = document.createElement('style');
style.textContent = `
#chapter-selection-page h2 {
    margin-top: 40px; /* Move the title text lower */
    text-align: center;
    color: #2c3e50; /* Keep the text dark */
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2); /* Add subtle drop shadow */
}

.chapter-button.started {
    background-color: #FFD700 !important;
    color: #2c3e50 !important;
}

.chapter-button.completed {
    background-color: #4CAF50 !important;
    color: white !important;
}
`;
document.head.appendChild(style);

// Function to show text size help
function showTextSizeHelp() {
    const popup = document.createElement('div');
    popup.className = 'popup-overlay';
    popup.innerHTML = `
        <div class="popup-content">
            <h3>Text Size Help</h3>
            <p>Adjusting the text size allows you to make the text larger or smaller for better readability. Use the slider to find the size that works best for you.</p>
            <button onclick="this.parentElement.parentElement.remove()">Close</button>
        </div>
    `;
    document.body.appendChild(popup);
}

// Add event listeners for transportation buttons
document.addEventListener('DOMContentLoaded', function() {
  const cycleTrailButton = document.querySelector('.transport-button.cycle-trail');
  const carTrailButton = document.querySelector('.transport-button.car-trail');
  
  // Set initial white text for both buttons
  if (cycleTrailButton) {
    cycleTrailButton.style.color = 'white';
  }
  if (carTrailButton) {
    carTrailButton.style.color = 'white';
  }
  
  if (cycleTrailButton) {
    cycleTrailButton.addEventListener('click', function() {
      console.log('Cycle Trail selected');
      // Remove car-trail class and add cycle-trail class
      document.querySelectorAll('.transport-button').forEach(btn => {
        btn.classList.remove('cycle-trail', 'car-trail');
      });
      this.classList.add('cycle-trail');
      showScreen('start-page');
      updateChapterButtons(); // Update buttons immediately
    });
  }
  
  if (carTrailButton) {
    carTrailButton.addEventListener('click', function() {
      console.log('Car Trail selected');
      // Remove cycle-trail class and add car-trail class
      document.querySelectorAll('.transport-button').forEach(btn => {
        btn.classList.remove('cycle-trail', 'car-trail');
      });
      this.classList.add('car-trail');
      showScreen('start-page');
      updateChapterButtons(); // Update buttons immediately
    });
  }
});

const amenitiesData = {
    1: {
        categories: {
            "🍽️ Restaurants & Cafés": [
                {
                    name: "Bofey Quinns Bar & Restaurant",
                    description: "A cozy Irish pub offering traditional fare and a warm atmosphere. Located in Corofin.",
                    link: "https://www.google.com/maps/place/Bofey+Quinns+Bar+%26+Restaurant"
                },
                {
                    name: "Sullivan's Royal Hotel",
                    description: "Traditional Irish hotel with restaurant and bar facilities.",
                    link: "https://www.google.com/maps/place/Sullivan's+Royal+Hotel"
                }
            ],
            "🛏️ Accommodation": [
                {
                    name: "Fergus View",
                    description: "A family-run B&B with stunning views of the Burren.",
                    link: "https://www.google.com/maps/place/Fergus+View"
                },
                {
                    name: "Corofin Hostel and Camping Park",
                    description: "Budget-friendly accommodation with hostel rooms and camping facilities.",
                    link: "https://www.google.com/maps/place/Corofin+Hostel+and+Camping+Park"
                },
                {
                    name: "Hazelwood Lodge",
                    description: "Comfortable lodging in a peaceful setting.",
                    link: "https://www.google.com/maps/place/Hazelwood+Lodge"
                }
            ],
            "📍 Points of Interest": [
                {
                    name: "The Burren National Park",
                    description: "Explore unique limestone landscapes and diverse flora.",
                    link: "https://www.google.com/maps/place/The+Burren+National+Park"
                },
                {
                    name: "Corofin Heritage Centre",
                    description: "Delve into local history and genealogy.",
                    link: "https://www.google.com/maps/place/Corofin+Heritage+Centre"
                }
            ]
        }
    },
    2: {
        categories: {
            "🍽️ Restaurants & Cafés": [
                {
                    name: "Morrissey's of Doonbeg",
                    description: "Traditional Irish pub and restaurant.",
                    link: "https://www.google.com/maps/place/Morrissey's+of+Doonbeg"
                },
                {
                    name: "The Half Barrel",
                    description: "Known for its seafood dishes and friendly service.",
                    link: "https://www.google.com/maps/place/The+Half+Barrel"
                }
            ],
            "🛏️ Accommodation": [
                {
                    name: "The Glendalough Hotel",
                    description: "Historic hotel in a scenic location.",
                    link: "https://www.google.com/maps/place/The+Glendalough+Hotel"
                },
                {
                    name: "Birchdale House B&B",
                    description: "Charming bed and breakfast with warm hospitality.",
                    link: "https://www.google.com/maps/place/Birchdale+House+B%26B"
                }
            ],
            "📍 Points of Interest": [
                {
                    name: "St. Kevin's Cell",
                    description: "Historic monastic site with ancient ruins.",
                    link: "https://www.google.com/maps/place/St.+Kevin's+Cell"
                },
                {
                    name: "Glendalough Monastic Site",
                    description: "Ancient monastic settlement with round tower.",
                    link: "https://www.google.com/maps/place/Glendalough+Monastic+Site"
                }
            ]
        }
    },
    3: {
        categories: {
            "🍽️ Restaurants & Cafés": [
                {
                    name: "The Wild Atlantic Lodge",
                    description: "Offers seafood and Irish cuisine in a cozy setting.",
                    link: "https://www.google.com/maps/place/The+Wild+Atlantic+Lodge"
                },
                {
                    name: "Burren Fine Wine and Food",
                    description: "Specializes in local cheeses and wines.",
                    link: "https://www.google.com/maps/place/Burren+Fine+Wine+and+Food"
                },
                {
                    name: "Monks Ballyvaughan",
                    description: "Renowned for its seafood dishes and harbor views.",
                    link: "https://www.google.com/maps/place/Monks+Ballyvaughan+Seafood+Restaurant+%26+Bar"
                }
            ],
            "🛏️ Accommodation": [
                {
                    name: "Hazelwood Lodge",
                    description: "Comfortable lodging in a peaceful setting.",
                    link: "https://www.google.com/maps/place/Hazelwood+Lodge"
                },
                {
                    name: "Cappabhaile House",
                    description: "Spacious B&B with views of the Burren.",
                    link: "https://www.google.com/maps/place/Cappabhaile+House"
                },
                {
                    name: "Doolin Inn",
                    description: "Boutique inn with views of the Atlantic.",
                    link: "https://www.google.com/maps/place/Doolin+Inn"
                }
            ],
            "📍 Points of Interest": [
                {
                    name: "Aillwee Cave",
                    description: "Explore the ancient cave system and birds of prey center.",
                    link: "https://www.google.com/maps/place/Aillwee+Cave"
                },
                {
                    name: "The Burren",
                    description: "Unique karst landscape with diverse flora.",
                    link: "https://www.google.com/maps/place/The+Burren"
                }
            ]
        }
    },
    4: {
        categories: {
            "🍽️ Restaurants & Cafés": [
                {
                    name: "Vaughan's Pub",
                    description: "Traditional Irish pub featured in 'Father Ted' episodes.",
                    link: "https://www.google.com/maps/place/Vaughan's+Pub"
                },
                {
                    name: "Linnane's Pub",
                    description: "Another filming location offering local dishes.",
                    link: "https://www.google.com/maps/place/Linnane's+Pub"
                }
            ],
            "🛏️ Accommodation": [
                {
                    name: "Kilcarragh House B&B",
                    description: "Comfortable rooms with a friendly atmosphere.",
                    link: "https://www.google.com/maps/place/Kilcarragh+House+B%26B"
                },
                {
                    name: "Kilfenora Hostel",
                    description: "Budget-friendly option for travelers.",
                    link: "https://www.google.com/maps/place/Kilfenora+Hostel"
                },
                {
                    name: "Ballybreen House",
                    description: "Charming guesthouse in a peaceful setting.",
                    link: "https://www.google.com/maps/place/Ballybreen+House"
                }
            ],
            "📍 Points of Interest": [
                {
                    name: "Kilfenora Cathedral",
                    description: "Historic site with high crosses.",
                    link: "https://www.google.com/maps/place/Kilfenora+Cathedral"
                },
                {
                    name: "The Burren Centre",
                    description: "Interactive exhibits on the region's geology and history.",
                    link: "https://www.google.com/maps/place/The+Burren+Centre"
                }
            ]
        }
    },
    5: {
        categories: {
            "🍽️ Restaurants & Cafés": [
                {
                    name: "The Ivy Cottage",
                    description: "Seafood restaurant with a charming garden in Doolin.",
                    link: "https://www.google.com/maps/place/The+Ivy+Cottage"
                },
                {
                    name: "Gus O'Connor's Pub",
                    description: "Traditional pub known for live music and seafood.",
                    link: "https://www.google.com/maps/place/Gus+O'Connor's+Pub"
                }
            ],
            "🛏️ Accommodation": [
                {
                    name: "Cliffs of Moher Hotel",
                    description: "Modern hotel close to the cliffs in Liscannor.",
                    link: "https://www.google.com/maps/place/Cliffs+of+Moher+Hotel"
                },
                {
                    name: "Doolin Inn",
                    description: "Boutique inn with views of the Atlantic.",
                    link: "https://www.google.com/maps/place/Doolin+Inn"
                }
            ]
        }
    }
};

function createAmenitiesSection(chapterNum) {
    const amenities = amenitiesData[chapterNum];
    if (!amenities) return null;

    const section = document.createElement('div');
    section.className = 'amenities-section';
    
    // Add header with correct title based on chapter
    const header = document.createElement('div');
    header.className = 'amenities-header';
    header.textContent = chapterNum === "1" ? "Nearby Amenities" : "Amenities Along Your Route";
    section.appendChild(header);

    Object.entries(amenities.categories).forEach(([category, items]) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'amenities-category';

        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        categoryHeader.innerHTML = `
            <span class="category-title">${category}</span>
            <span class="category-toggle">▼</span>
        `;

        const categoryContent = document.createElement('div');
        categoryContent.className = 'category-content';

        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'amenity-item';
            itemDiv.innerHTML = `
                <div class="amenity-name">
                    <a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.name}</a>
                </div>
                <div class="amenity-description">${item.description}</div>
            `;
            categoryContent.appendChild(itemDiv);
        });

        categoryHeader.addEventListener('click', () => {
            categoryContent.classList.toggle('active');
            categoryHeader.querySelector('.category-toggle').classList.toggle('active');
        });

        categoryDiv.appendChild(categoryHeader);
        categoryDiv.appendChild(categoryContent);
        section.appendChild(categoryDiv);
    });

    return section;
}

// Update the updateChapterContent function to include amenities
function updateChapterContent(chapter) {
    // ... existing code ...
    
    // Add amenities section after chapter info
    const chapterInfo = document.querySelector('#chapter-page .chapter-info');
    if (chapterInfo) {
        const amenitiesSection = createAmenitiesSection(chapter);
        if (amenitiesSection) {
            chapterInfo.parentNode.insertBefore(amenitiesSection, chapterInfo.nextSibling);
        }
    }
    
    // ... rest of existing code ...
}