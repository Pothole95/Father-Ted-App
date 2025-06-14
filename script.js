let locations = [];
let currentLocationIndex = 0;
let map;
let directionsService;
let directionsRenderer;
let userMarker;
let navigationStack = []; // Stack to track navigation history
let lastScreen = null; // Track the last screen
let navigationHistory = ['intro-screen']; // Initialize with intro screen
let previousScreen = null;
let lastBackPressTime = 0;
const DOUBLE_BACK_THRESHOLD = 2000; // 2 seconds in milliseconds

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
  "settings-page": "chapter-selection-page",
  "more-from-ted-page": "chapter-selection-page"
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
    narrative: "Ted wakes up to find the Holy Stone (which was being stored very securely in a biscuit tin under Father Jack's chair) has vanished. Dougal thinks he remembers seeing a very \"cool-looking priest\" in the night.\n\nTed suggests visiting St. Kevin's Stump immediately, worried that the iconic stump might be the thief's next target.",
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
    description: "Visit the famous rock where Ted and Dougal had their climbing adventure.",
    narrative: "By the rock, a local man reports seeing a \"young priest with an earring\" listening to Oasis. The suspect ran away when he approached, dropping a flyer for a \"Pop-Up Priest Rave & Blessing Session\" at Aillwee Cave. Could this be connected to the theft?",
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
    description: "Explore the mysterious caves featured in 'The Mainland' episode.",
    narrative: "In the depths of Aillwee Cave, Ted and Dougal discover only Father Noel Furlong, who sadly informs them that only one priest showed up to his rave and blessing session. A young priest, saying something about \"Frosty not being cool\" and throwing a piece of paper at him. A receipt. Cigarettes purchased in Kilfenora village!",
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
    description: "Visit the village where many Father Ted scenes were filmed.",
    narrative: "Inside Vaughan's pub, Ted asks the bartender about the Holy Stone. The bartender recalls: \"A priest came in this morning with some kind of stone. Claimed it was blessed and tried to trade it for my leather jacket. He said, 'I'd rather throw it in the sea than give it back to those eejits.'\" The pieces are starting to come together!",
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
    description: "Experience the dramatic cliffs featured in the 'Tentacles of Doom' episode.",
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
  cycleTrail: {
    completedChapters: new Set(),
    progress: 0,
    quizCompleted: false
  },
  carTrail: {
    completedChapters: new Set(),
    progress: 0,
    quizCompleted: false
  },
  activeTrail: null,
  
  init() {
    console.log('Initializing AppState...');
    
    try {
      const saved = localStorage.getItem('appState');
      if (saved) {
        console.log('Loading saved state...');
        const state = JSON.parse(saved);
        
        // Load cycle trail state
        this.cycleTrail.completedChapters = new Set(state.cycleTrail.completedChapters.map(String));
        this.cycleTrail.progress = state.cycleTrail.progress || Math.min(100, this.cycleTrail.completedChapters.size * 20);
        this.cycleTrail.quizCompleted = state.cycleTrail.quizCompleted || false;
        
        // Load car trail state
        this.carTrail.completedChapters = new Set(state.carTrail.completedChapters.map(String));
        this.carTrail.progress = state.carTrail.progress || Math.min(100, this.carTrail.completedChapters.size * 20);
        this.carTrail.quizCompleted = state.carTrail.quizCompleted || false;
        
        // Load active trail
        this.activeTrail = state.activeTrail;
        
        console.log('Loaded state:', { 
          cycleChapters: Array.from(this.cycleTrail.completedChapters),
          carChapters: Array.from(this.carTrail.completedChapters),
          activeTrail: this.activeTrail,
          cycleQuizCompleted: this.cycleTrail.quizCompleted,
          carQuizCompleted: this.carTrail.quizCompleted
        });
      } else {
        // Only initialize empty state if no saved state exists
        this.cycleTrail.completedChapters.clear();
        this.carTrail.completedChapters.clear();
        this.cycleTrail.progress = 0;
        this.carTrail.progress = 0;
        this.cycleTrail.quizCompleted = false;
        this.carTrail.quizCompleted = false;
        this.activeTrail = null;
      }
    } catch (e) {
      console.error('Error loading state:', e);
      // Initialize empty state only if there's an error loading
      this.cycleTrail.completedChapters.clear();
      this.carTrail.completedChapters.clear();
      this.cycleTrail.progress = 0;
      this.carTrail.progress = 0;
      this.cycleTrail.quizCompleted = false;
      this.carTrail.quizCompleted = false;
      this.activeTrail = null;
    }
    
    // Clear all indicators and update UI
    this.clearAllIndicators();
    this.updateUI();
  },
  
  clearAllIndicators() {
    console.log('Clearing all indicators...');
    const indicators = document.querySelectorAll('.in-progress');
    indicators.forEach(indicator => {
      if (indicator && indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    });
  },
  
  updateIndicators() {
    console.log('Updating indicators...');
    this.clearAllIndicators();
    
    const cycleButton = document.querySelector('.transport-button.cycle-trail');
    const carButton = document.querySelector('.transport-button.car-trail');
    
    console.log('Found buttons for indicators:', {
      cycleButton: cycleButton ? 'yes' : 'no',
      carButton: carButton ? 'yes' : 'no'
    });
    
    console.log('Current state:', {
      cycleChapters: Array.from(this.cycleTrail.completedChapters),
      carChapters: Array.from(this.carTrail.completedChapters),
      activeTrail: this.activeTrail
    });
    
    // Add indicator to cycle button if it has completed chapters
    if (cycleButton && this.cycleTrail.completedChapters.size > 0) {
      console.log('Adding in-progress indicator to cycle button');
      const cycleIndicator = document.createElement('div');
      cycleIndicator.className = 'in-progress';
      cycleIndicator.textContent = 'In Progress';
      cycleButton.appendChild(cycleIndicator);
    }
    
    // Add indicator to car button if it has completed chapters
    if (carButton && this.carTrail.completedChapters.size > 0) {
      console.log('Adding in-progress indicator to car button');
      const carIndicator = document.createElement('div');
      carIndicator.className = 'in-progress';
      carIndicator.textContent = 'In Progress';
      carButton.appendChild(carIndicator);
    }
  },
  
  markChapterCompleted(chapterNum) {
    console.log('Marking chapter as completed:', chapterNum);
    if (!chapterNum) {
        console.error('No chapter number provided');
        return;
    }
    
    // Convert chapter number to string for consistency
    chapterNum = String(chapterNum);
    
    // Use the activeTrail property to determine which trail to update
    if (this.activeTrail === 'cycle') {
        this.cycleTrail.completedChapters.add(chapterNum);
        // Calculate progress as percentage of total chapters (5 chapters total)
        this.cycleTrail.progress = Math.min(100, (this.cycleTrail.completedChapters.size / 5) * 100);
        console.log('Added to cycle trail:', {
            chapter: chapterNum,
            completedChapters: Array.from(this.cycleTrail.completedChapters),
            progress: this.cycleTrail.progress
        });
    } else if (this.activeTrail === 'car') {
        this.carTrail.completedChapters.add(chapterNum);
        // Calculate progress as percentage of total chapters (5 chapters total)
        this.carTrail.progress = Math.min(100, (this.carTrail.completedChapters.size / 5) * 100);
        console.log('Added to car trail:', {
            chapter: chapterNum,
            completedChapters: Array.from(this.carTrail.completedChapters),
            progress: this.carTrail.progress
        });
    } else {
        console.error('No active trail set');
        return;
    }
    
    this.save();
    this.updateUI();
  },
  
  isChapterCompleted(chapterNum) {
    if (!chapterNum) return false;
    chapterNum = String(chapterNum);
    
    // Use the activeTrail property to check the correct trail
    if (this.activeTrail === 'cycle') {
      return this.cycleTrail.completedChapters.has(chapterNum);
    } else if (this.activeTrail === 'car') {
      return this.carTrail.completedChapters.has(chapterNum);
    }
    return false;
  },
  
  save() {
    const state = {
      cycleTrail: {
        completedChapters: Array.from(this.cycleTrail.completedChapters),
        progress: this.cycleTrail.progress,
        quizCompleted: this.cycleTrail.quizCompleted
      },
      carTrail: {
        completedChapters: Array.from(this.carTrail.completedChapters),
        progress: this.carTrail.progress,
        quizCompleted: this.carTrail.quizCompleted
      },
      activeTrail: this.activeTrail
    };
    localStorage.setItem('appState', JSON.stringify(state));
  },
  
  updateUI() {
    console.log('Updating UI...');
      const currentProgress = this.activeTrail === 'cycle' ? 
        this.cycleTrail.progress : 
        this.carTrail.progress;
    
    updateProgressBar(currentProgress);
    this.updateIndicators();
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

// Function to show a specific screen
function showScreen(screenId, isBack = false) {
  const currentScreen = document.querySelector('.screen.active');
  if (currentScreen && currentScreen.id !== screenId && !isBack) {
    navigationStack.push(currentScreen.id);
  }

  // Hide all screens
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  
  // Show the requested screen
  const screen = document.getElementById(screenId);
  if (screen) {
    screen.classList.add('active');
    
    // Initialize chapter content when showing chapter selection page
    if (screenId === 'chapter-selection-page') {
      console.log('Initializing chapter selection page...');
      updateChapterButtons();
      
      // Update progress bar
      const progressBar = document.querySelector('.progress-bar');
      if (progressBar) {
        const currentProgress = AppState.activeTrail === 'cycle' ? 
          AppState.cycleTrail.progress : 
          AppState.carTrail.progress;
        progressBar.style.width = `${currentProgress}%`;
        console.log('Updated progress bar:', currentProgress);
    }
  }

    // Update indicators when showing transportation page
    if (screenId === 'transportation-page') {
      console.log('Updating indicators for transportation page...');
      AppState.updateIndicators();
    }
  } else {
    console.error('Screen not found:', screenId);
  }
  
  // Always re-initialize button handlers after navigation
  setTimeout(initializeButtonHandlers, 0);
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
      
      // Remove any existing amenities sections
      const chapterPage = document.getElementById('chapter-page');
      if (chapterPage) {
        const existingAmenities = chapterPage.querySelector('.amenities-section');
        if (existingAmenities) {
          existingAmenities.remove();
        }
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

  // Update chapter number and title
  document.getElementById('chapter-number').textContent = `Chapter ${chapterNumber}`;
  document.getElementById('chapter-title').textContent = data.title;
  
  // Add transport mode info
  const transportMode = document.querySelector('.transport-button.cycle-trail').style.backgroundColor === 'rgb(76, 175, 80)' ? 'bike' : 'car';
  const durationInfo = chapterNumber === "1" ? "" : `Estimated duration: ${data.duration[transportMode]}`;
  const difficultyInfo = transportMode === 'bike' && data.difficulty && chapterNumber !== "1" ? ` | Trail difficulty: ${data.difficulty}` : '';
  
  const chapterDescription = document.getElementById('chapter-description');
  chapterDescription.innerHTML = `
    <div class="story-container">
      <p>${data.narrative}</p>
    </div>
    <div class="location-info-container">
      <div class="chapter-info">
        ${chapterNumber === "1" ? "Starting Point" : `${durationInfo}${difficultyInfo}`}
      </div>
    </div>
  `;
  
  // Remove all existing location facts containers and empty containers
  const chapterPage = document.getElementById('chapter-page');
  if (chapterPage) {
    // Remove all location facts containers
    chapterPage.querySelectorAll('.location-facts-container').forEach(container => container.remove());
    
    // Remove any empty containers
    chapterPage.querySelectorAll('.amenities-section:empty, .location-facts-container:empty').forEach(container => container.remove());
  }
  
  // Add location facts after the image
  const locationFactsContainer = document.createElement('div');
  locationFactsContainer.className = 'location-facts-container';
  locationFactsContainer.innerHTML = `
    <h3>Location Facts</h3>
    <ul>
      <li>${data.description}</li>
      ${getLocationFacts(chapterNumber)}
    </ul>
  `;
  
  const chapterImage = document.getElementById('chapter-image');
  if (chapterImage && chapterImage.parentNode) {
    chapterImage.parentNode.insertBefore(locationFactsContainer, chapterImage.nextSibling);
  }
  
  document.getElementById('chapter-image').src = data.image;
  document.getElementById('im-here').textContent = data.arrivalText;
  
  console.log('Chapter info updated:', data);
}

// Helper function to get location facts for each chapter
function getLocationFacts(chapterNumber) {
  const facts = {
    "1": [
      "The Parochial House was the main filming location for Father Ted's home, built in 1825.",
      "Featured in the famous 'small, far away' cows scene overlooking the Burren.",
      "The church's leaning tower has maintained its tilt since the Great Famine."
    ],
    "2": [
      "Bofey Quinns pub, established in 1864, was featured in several pub scenes.",
      "Doonbeg Castle provided the backdrop for Ted and Dougal's climbing adventure.",
      "The local beach was used for the famous 'I'm not a fascist' scene."
    ],
    "3": [
      "The Wild Atlantic Lodge was featured in the 'Mainland' episode's cave exploration.",
      "The Poll na Gollum cave system was the setting for the 'very dark' scene.",
      "The area's seal colony can be seen in the background of several episodes."
    ],
    "4": [
      "Vaughan's Pub has been in the same family since 1865 and was a key filming location.",
      "The market square was used for the famous 'Lovely Girls' competition scene.",
      "The village's round tower appears in the background of several episodes."
    ],
    "5": [
      "The Cliffs of Moher were featured in the dramatic 'Tentacles of Doom' episode.",
      "The visitor center appears in the episode where Ted gives a tour to visitors.",
      "The sea stack known as Branaunmore appears in several cliff-top scenes."
    ]
  };
  
  return facts[chapterNumber] ? facts[chapterNumber].map(fact => `<li>${fact}</li>`).join('') : '';
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
  const currentTime = Date.now();
  const timeSinceLastPress = currentTime - lastBackPressTime;
  
  if (timeSinceLastPress < DOUBLE_BACK_THRESHOLD) {
    // Double back detected - go to trail select page
    showScreen('transportation-page', true);
    lastBackPressTime = 0; // Reset the timer
  } else {
    // Single back press - normal navigation
    if (navigationStack.length > 0) {
      const previousScreen = navigationStack.pop();
      showScreen(previousScreen, true);
    } else {
      showScreen('intro-screen', true);
    }
    lastBackPressTime = currentTime;
  }
}

// Initialize back button handlers
document.addEventListener('DOMContentLoaded', () => {
  // Add back button handlers
  document.querySelectorAll('#back-button').forEach(button => {
    button.addEventListener('click', handleBackButton);
  });
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
        
        // Mark chapter as completed in AppState
        AppState.markChapterCompleted(chapterNumber);
        
        // Update map markers
        if (window.markers && locations) {
            const markerIndex = locations.findIndex(loc => 
                loc.properties.chapterNumber === chapterNumber.toString()
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
        showCongratulations(chapterNumber);
    } else {
        showError("Keep exploring! You'll find it soon!");
    }
}

// Update chapter button click handlers
function initializeButtonHandlers() {
    console.log('Initializing button handlers...');
    // Transportation buttons
    document.querySelectorAll('.transport-button.cycle-trail').forEach(btn => {
        btn.onclick = function() {
            AppState.activeTrail = 'cycle';
            showScreen('cycle-start-page');
        };
    });
    document.querySelectorAll('.transport-button.car-trail').forEach(btn => {
        btn.onclick = function() {
            AppState.activeTrail = 'car';
            showScreen('car-start-page');
        };
        });
    // Start trail buttons
    document.querySelectorAll('#start-trail-button').forEach(btn => {
        btn.onclick = function(e) {
            e.preventDefault();
            showScreen('chapter-selection-page');
        };
    });
    // Chapter buttons
    document.querySelectorAll('.chapter-button').forEach(btn => {
        btn.onclick = function() {
            const chapterNum = this.getAttribute('data-chapter');
            if (!chapterNum) return;
            playSound(`chapter${chapterNum}Click`);
            this.classList.add('started');
            loadChapterData(chapterNum);
            showScreen('chapter-page');
        };
    });
    // Settings and back buttons
    document.querySelectorAll('#settings-button').forEach(btn => {
        btn.onclick = function() { showScreen('settings-page'); };
    });
    document.querySelectorAll('#back-button').forEach(btn => {
        btn.removeEventListener('click', handleBackButton);
        btn.addEventListener('click', handleBackButton);
    });
    // More from Ted
    const moreFromTedButton = document.getElementById('more-from-ted-button');
    if (moreFromTedButton) {
        moreFromTedButton.onclick = function() { showScreen('more-from-ted-page'); };
    }
}

// Patch showScreen to always re-initialize handlers after navigation
const _showScreen = showScreen;
showScreen = function(screenId) {
    _showScreen(screenId);
    setTimeout(initializeButtonHandlers, 0); // Re-attach after DOM updates
};

// Patch AppState to persist and restore activeTrail
AppState.activeTrail = function(trailType) {
    this.activeTrail = trailType;
    localStorage.setItem('activeTrail', trailType);
    this.save();
    this.updateUI();
};

// On load, restore activeTrail
const savedTrail = localStorage.getItem('activeTrail');
if (savedTrail) AppState.activeTrail = savedTrail;

// Function to update chapter buttons and progress
function updateChapterButtons() {
    const isCycleTrail = AppState.activeTrail === 'cycle';
    document.querySelectorAll('.chapter-button').forEach(button => {
        const chapterNum = button.getAttribute('data-chapter');
        const isCompleted = AppState.isChapterCompleted(chapterNum);
        const data = chapterData[chapterNum];
        button.classList.remove('completed', 'started');
        let checkmark = button.querySelector('.completion-checkmark');
        if (checkmark) checkmark.remove();
        checkmark = document.createElement('span');
        checkmark.className = 'completion-checkmark';
        checkmark.textContent = '✓';
        button.appendChild(checkmark);
        const chapterContent = button.querySelector('.chapter-content');
        if (chapterContent && data) {
            let infoContent = '';
            if (chapterNum === "1") {
                infoContent = `<div class=\"distance\">Starting Point</div>`;
            } else {
                if (isCycleTrail) {
                    infoContent = `
                        <div class=\"distance\">${data.distance}</div>
                        <div class=\"duration\">${data.duration.bike}</div>
                        <div class=\"difficulty\" data-difficulty=\"${data.difficulty}\">${data.difficulty}</div>
                    `;
                } else {
                    infoContent = `
                        <div class=\"distance\">${data.distance}</div>
                        <div class=\"duration\">${data.duration.car}</div>
                    `;
                }
            }
            chapterContent.innerHTML = `
                <div class=\"chapter-title\">Chapter ${chapterNum}: ${data.title}</div>
                <div class=\"chapter-info\">
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

    // Update progress bar and caravan
    const progressBar = document.querySelector('.progress-bar');
    const progressFill = progressBar.querySelector('.progress-fill');
    const progressText = progressBar.querySelector('.progress-text');
    const caravanIcon = progressBar.querySelector('.caravan-icon');
    
    if (progressBar && progressFill && progressText && caravanIcon) {
        const currentProgress = isCycleTrail ? 
            AppState.cycleTrail.progress : 
            AppState.carTrail.progress;
        
        // Update progress fill width
        progressFill.style.width = `${currentProgress}%`;
        
        // Update progress text
        progressText.textContent = `${Math.round(currentProgress)}%`;
        
        // Position caravan based on progress
        if (currentProgress === 0) {
            // Move caravan even further left at 0%
            caravanIcon.style.left = '-48px';
        } else if (currentProgress <= 60) {
            // Keep caravan further left until 60%
            caravanIcon.style.left = '-24px';
            } else {
            // Normal positioning after 60%
            caravanIcon.style.left = '0px';
        }
    }
}

// Initialize progress bar when page loads
document.addEventListener('DOMContentLoaded', () => {
    const progressBar = document.querySelector('.progress-bar');
    const progressFill = progressBar.querySelector('.progress-fill');
    const caravanIcon = progressBar.querySelector('.caravan-icon');
    if (progressBar && progressFill && caravanIcon) {
        progressFill.style.width = '0%';
        progressFill.style.backgroundColor = '#FF0000'; // Start with red
        caravanIcon.style.left = '0px';
    }
});

// Helper function to get chapter titles
function getChapterTitle(chapterNumber) {
  const data = chapterData[chapterNumber];
  return data ? `Chapter ${chapterNumber}: ${data.title}` : `Chapter ${chapterNumber}`;
}

// Helper function to get chapter descriptions
function getChapterDescription(chapterNumber) {
  const descriptions = {
    "1": "Begin your journey at the iconic parochial house where Father Ted, Dougal, and Jack lived.",
    "2": "Visit the famous rock where Ted and Dougal had their climbing adventure.",
    "3": "Explore the mysterious caves featured in 'The Mainland' episode.",
    "4": "Visit the village where many Father Ted scenes were filmed.",
    "5": "Experience the dramatic cliffs featured in the 'Tentacles of Doom' episode."
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
  "1": "Can you see Father Ted's House where the Holy Stone was stolen?",
  "2": "Can you see the rock where Ted and Dougal had their climbing adventure?",
  "3": "Can you see the entrance to the very dark caves where the receipt was found?",
  "4": "Can you see Vaughan's pub where Ted met the Chinese community?",
  "5": "Can you see the mighty Cliffs of Moher where the stone was thrown?"
};

// Chapter-specific congratulation messages
const congratulationMessages = {
  "1": "The trail begins! Head to St. Kevin's Stump to follow the first clue about the mysterious priest.",
  "2": "Interesting find! The rave flyer suggests our next stop should be Aillwee Cave.",
  "3": "That receipt is a crucial clue! Let's follow it to Kilfenora Village.",
  "4": "The bartender's story is revealing! The Cliffs of Moher might be our final stop.",
  "5": "You've reached the end of the trail! Time to put all the clues together and identify the culprit in the final quiz!"
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
      <p style="font-family: inherit; font-size: 1.1em; line-height: 1.5; margin-bottom: 1em;">${locationQuestions[chapterNumber] || `Are you at Chapter ${chapterNumber}'s location?`}</p>
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
      <p style="font-family: inherit; font-size: 1.1em; line-height: 1.5; margin-bottom: 1em;">${congratulationMessages[chapterNumber] || 'Well done on completing this chapter!'}</p>
      <button class="popup-button yes" onclick="handleCongratulations()">Continue</button>
    </div>
  `;
  document.body.appendChild(popup);
}

// Function to handle congratulations continuation
function handleCongratulations() {
    // Remove all popup overlays
    document.querySelectorAll('.popup-overlay').forEach(popup => popup.remove());
    
    // Check which trail is active using AppState.activeTrail
    const isBikeMode = AppState.activeTrail === 'cycle';
    const currentTrail = isBikeMode ? AppState.cycleTrail : AppState.carTrail;
    
    console.log('Checking completion:', {
        activeTrail: AppState.activeTrail,
        completedChapters: Array.from(currentTrail.completedChapters),
        size: currentTrail.completedChapters.size,
        quizCompleted: currentTrail.quizCompleted
    });
    
    // Hide both quiz and completion message initially
    const finalQuiz = document.getElementById('final-quiz');
    const completionMessage = document.getElementById('completion-message');
    if (finalQuiz) finalQuiz.style.display = 'none';
    if (completionMessage) completionMessage.style.display = 'none';
    
    // Only proceed if we have an active trail
    if (!AppState.activeTrail) {
        return;
    }
    
    // Check if all 5 chapters are completed for the current trail
    if (currentTrail.completedChapters.size === 5) {
        if (!currentTrail.quizCompleted) {
            // Show final quiz if not completed yet
            if (finalQuiz) {
                finalQuiz.style.display = 'block';
                
                // Remove any existing event listeners
                const quizOptions = finalQuiz.querySelectorAll('.quiz-option');
                quizOptions.forEach(option => {
                    const newOption = option.cloneNode(true);
                    option.parentNode.replaceChild(newOption, option);
                });
                
                // Add new click handlers for quiz options
                finalQuiz.querySelectorAll('.quiz-option').forEach(option => {
                    option.addEventListener('click', function() {
                        const isCorrect = this.getAttribute('data-answer') === 'damo';
                        const quizOptions = finalQuiz.querySelectorAll('.quiz-option');
                        
                        // Disable all options after selection
                        quizOptions.forEach(opt => opt.disabled = true);
                        
                        if (isCorrect) {
                            this.classList.add('correct');
                            // Mark quiz as completed for current trail only
                            if (isBikeMode) {
                                AppState.cycleTrail.quizCompleted = true;
                            } else {
                                AppState.carTrail.quizCompleted = true;
                            }
                            AppState.save();
                            
                            // Hide quiz and show completion message after a short delay
                            setTimeout(() => {
                                finalQuiz.style.display = 'none';
                                if (completionMessage) {
                                    completionMessage.style.display = 'block';
                                    completionMessage.innerHTML = `
                                        <h3>🎉 Congratulations! 🎉</h3>
                                        <p class="body-text">You've successfully completed the Craggy Island Trail! You've had your fun, and that's all that matters.</p>
                                        <div class="button-container">
                                            <button class="certificate-button" onclick="downloadCertificate()">Download Certificate</button>
                                            <button class="share-button" onclick="shareApp()">Share</button>
                                        </div>
                                    `;
                                }
                            }, 1000);
                        } else {
                            this.classList.add('incorrect');
                            // Show error message and reset after a short delay
                            setTimeout(() => {
                                showError("That's not quite right! Try again!");
                                this.classList.remove('incorrect');
                                // Re-enable all options
                                quizOptions.forEach(opt => opt.disabled = false);
                            }, 1000);
                        }
                    });
                });
            }
        } else if (AppState.activeTrail === (isBikeMode ? 'cycle' : 'car')) {
            // Only show completion message if this is the active trail
            if (completionMessage) {
                completionMessage.style.display = 'block';
                completionMessage.innerHTML = `
                    <h3>🎉 Congratulations! 🎉</h3>
                    <p class="body-text">You've successfully completed the Craggy Island Trail! You've had your fun, and that's all that matters.</p>
                    <div class="button-container">
                        <button class="certificate-button" onclick="downloadCertificate()">Download Certificate</button>
                        <button class="share-button" onclick="shareApp()">Share</button>
                    </div>
                `;
            }
        }
    }
    
    // Return to chapter selection
    showScreen('chapter-selection-page');
}

// Helper function to count completed locations
function getCompletedLocations() {
  return locations.filter(loc => loc.properties.completed).length;
}

// Function to reset the trail
function resetTrail() {
    // Clear all state for both trails
    AppState.cycleTrail.completedChapters.clear();
    AppState.carTrail.completedChapters.clear();
    AppState.cycleTrail.progress = 0;
    AppState.carTrail.progress = 0;
    AppState.cycleTrail.quizCompleted = false;
    AppState.carTrail.quizCompleted = false;
    AppState.activeTrail = null;
    
    // Clear localStorage
    localStorage.removeItem('appState');
    localStorage.removeItem('activeTrail');
    
    // Clear all indicators
    AppState.clearAllIndicators();
    
    // Hide completion message and quiz
    const completionMessage = document.getElementById('completion-message');
    if (completionMessage) {
        completionMessage.style.display = 'none';
    }
    const finalQuiz = document.getElementById('final-quiz');
    if (finalQuiz) {
        finalQuiz.style.display = 'none';
    }
    
    // Reset UI
    AppState.updateUI();
    
    // Show intro screen
    showScreen('intro-screen');
}

// Function to show reset confirmation
function showResetConfirmation() {
    const popup = document.createElement('div');
    popup.className = 'popup-overlay';
    popup.innerHTML = `
        <div class="popup-content">
            <h3>Reset Trail</h3>
            <p>Are you sure you want to reset your trail progress? This will clear all completed chapters and start you from the beginning.</p>
            <div class="popup-buttons">
                <button class="popup-button yes" onclick="resetTrail(); this.closest('.popup-overlay').remove();">Yes, Reset</button>
                <button class="popup-button no" onclick="this.closest('.popup-overlay').remove()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(popup);
}

// Update the settings initialization to use the new function
function initializeSettings() {
    const volumeSlider = document.getElementById('volume');
    const textSizeSlider = document.getElementById('text-size');
    const backgroundMusic = document.getElementById('background-music');
    
    // Load saved settings or use defaults
    const savedVolume = localStorage.getItem('volume') || 0.6; // 60% default
    const savedTextSize = localStorage.getItem('textSize') || 12; // 35% of max (24px)
    
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
        resetTrailButton.addEventListener('click', showResetConfirmation);
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
            backgroundMusic.play()
                .catch(error => console.error('Error playing music on screen change:', error));
    }
  } else {
    if (!backgroundMusic.paused) {
      backgroundMusic.pause();
    }
  }
}

// Initialize audio when the page loads
document.addEventListener('DOMContentLoaded', function() {
  const backgroundMusic = document.getElementById('background-music');
  if (backgroundMusic) {
        // Set initial volume
        backgroundMusic.volume = localStorage.getItem('volume') || 1;
        
        // Function to attempt playing the music
        function attemptPlay() {
            backgroundMusic.play()
                .then(() => {
                    console.log('Background music started playing');
                })
                .catch(error => {
      console.error('Error playing background music:', error);
                    // Try again after user interaction
                    document.addEventListener('click', function startMusic() {
                        backgroundMusic.play()
                            .then(() => {
                                console.log('Background music started after user interaction');
                            })
                            .catch(e => console.error('Failed to play after interaction:', e));
                        document.removeEventListener('click', startMusic);
                    }, { once: true });
                });
        }

        // Try to play immediately
        attemptPlay();
    }
});

// Add user interaction handler to start music
document.addEventListener('click', () => {
  const backgroundMusic = document.getElementById('background-music');
  if (backgroundMusic && backgroundMusic.paused) {
    backgroundMusic.play().catch(error => console.error('Error playing music on interaction:', error));
  }
}, { once: true });

// Update the DOMContentLoaded event listener
document.addEventListener("DOMContentLoaded", () => {
  // Initialize basic functionality
  AppState.init();
  initializeButtonHandlers();
  initializeSettings(); // Add settings initialization
  
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

  // Ensure indicators are updated after initialization
  AppState.updateIndicators();
});

// Add CSS for chapter-selection-page title
const style = document.createElement('style');
style.textContent = `
#chapter-selection-page h2 {
    margin-top: 20px;
    text-align: center;
    color: #2c3e50;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

/* Adjusted heading sizes */
h1 {
    font-size: 2.2em !important;
}

h2 {
    font-size: 1.9em !important;
}

h3 {
    font-size: 1.6em !important;
}

h4 {
    font-size: 1.4em !important;
}

h5 {
    font-size: 1.2em !important;
}

h6 {
    font-size: 1em !important;
}

/* Special styling for intro page title */
#intro-screen h1 {
    font-size: 2em !important;
}

/* Chapter number specific styling */
#chapter-number {
    font-size: 2.4em !important;
    margin-bottom: -0.5em !important;
}

/* Story container styling */
.story-container {
    background-color: white;
    opacity: 0.90;
    padding: 1.5em;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 1.5em;
}

/* Location info container styling */
.location-info-container {
    background: none;
    padding: 0;
    margin-bottom: 1.5em;
    text-align: center;
}

/* Improved text styling */
.welcome-text p {
    line-height: 1.6;
    margin-bottom: 1.2em;
    text-shadow: 0.5px 0.5px 1px rgba(0, 0, 0, 0.1);
}

.transportation-content .welcome-text {
    background: rgba(255, 255, 255, 0.9);
    padding: 2em;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin: 2em 0;
}

.transportation-content .welcome-text p {
    line-height: 1.5;
    margin-bottom: 0.8em;
    text-shadow: 0.5px 0.5px 1px rgba(0, 0, 0, 0.1);
}

.chapter-button.started {
    background-color: #FFD700 !important;
    color: #2c3e50 !important;
}

.chapter-button.completed {
    background-color: #4CAF50 !important;
    color: white !important;
}

.completion-message {
    text-align: center;
    margin-top: 2em;
}

.completion-message .button-container {
    display: flex;
    gap: 1em;
    justify-content: center;
    margin-top: 1.5em;
}

.certificate-button {
    background: linear-gradient(145deg, #4CAF50, #43A047, #388E3C);
    color: white;
    font-size: 16px;
    font-weight: bold;
    padding: 12px 30px;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    margin-top: 20px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
}

.certificate-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.2);
    background: linear-gradient(145deg, #43A047, #388E3C, #2E7D32);
}

/* Transportation page specific styles */
.transportation-content {
    padding: 1.5em;
    max-width: 800px;
    margin: 0 auto;
}

.transportation-content h1 {
    text-align: center;
    color: #2c3e50;
    margin-bottom: 1em;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

.transportation-content .welcome-text {
    background: rgba(255, 255, 255, 0.9);
    padding: 1.5em;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 1.5em;
    text-align: center;
}

.transportation-content .welcome-text p {
    line-height: 1.5;
    margin-bottom: 0.8em;
    text-shadow: 0.5px 0.5px 1px rgba(0, 0, 0, 0.1);
}

.transport-options {
    display: flex;
    flex-direction: column;
    gap: 1.2em;
    margin-top: 1em;
}

.transport-option {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
}

.transport-option.cycle {
    border-left: 4px solid #4CAF50;
    background: #4CAF50;
}

.transport-option.car {
    border-left: 4px solid #2196F3;
    background: #2196F3;
}

.transport-option .option-content {
    padding: 1.2em 1.5em;
    display: flex;
    flex-direction: column;
    gap: 0.4em;
    background: rgba(255, 255, 255, 0.9);
    position: relative;
    z-index: 1;
}

.transport-option p {
    color: #2c3e50;
    line-height: 1.4;
    font-size: 0.95em;
    margin: 0;
}

.transport-option .trail-info {
    color: #666;
    font-size: 0.9em;
    font-style: italic;
}

.transport-button {
    padding: 12px 25px;
    border: none;
    font-size: 15px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
    text-align: center;
    display: block;
    position: relative;
    margin: 0;
    left: 0;
    right: 0;
    bottom: 0;
    box-sizing: border-box;
}

.transport-button.cycle-trail {
    background: #4CAF50;
    color: white;
    border-top: none;
}

.transport-button.car-trail {
    background: #2196F3;
    color: white;
    border-top: none;
    margin-left: -4px;
    width: calc(100% + 4px);
    border-left: 4px solid #2196F3;
}

.transport-button:hover {
    background: #43A047;
    color: white;
}

.transport-button.car-trail:hover {
    background: #1976D2;
    color: white;
}

.transport-option.car .transport-button.car-trail {
    background: #2196F3 !important;
    color: white;
    border-top: none;
    margin-left: -4px;
    width: calc(100% + 4px);
    border-left: 4px solid #2196F3;
}

.transport-option.car .transport-button.car-trail:hover {
    background: #1976D2 !important;
    color: white;
}

.in-progress {
    position: absolute;
    top: 5px;
    right: 5px;
    font-size: 12px;
    font-weight: normal;
    background: rgba(255, 255, 255, 0.2);
    padding: 2px 6px;
    border-radius: 3px;
}

/* Chapter page specific styles */
.story-container {
    background: rgba(255, 255, 255, 0.9);
    padding: 1.5em;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 1.5em;
}

.story-container h2 {
    color: #2c3e50;
    margin-bottom: 1em;
    font-size: 1.8em;
}

.story-container p {
    line-height: 1.6;
    color: #333;
    font-size: 1.1em;
}

.location-facts-container {
    background: rgba(255, 255, 255, 0.9);
    padding: 1.5em;
    border-radius: 10px;
    margin-top: 1.5em;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.location-facts-container h3 {
    color: #2c3e50;
    margin-bottom: 1em;
    font-size: 1.4em;
}

.location-facts-container ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
}

.location-facts-container li {
    padding: 0.5em 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    color: #333;
    line-height: 1.4;
}

.location-facts-container li:last-child {
    border-bottom: none;
}
`;
document.head.appendChild(style);

// Function to download certificate
function downloadCertificate() {
  const isBikeMode = document.querySelector('.transport-button.cycle-trail').style.backgroundColor === 'rgb(76, 175, 80)';
  const certificateImage = isBikeMode ? 'congrats-bike.jpg' : 'congrats-car.jpg';
  
  // Create a temporary link element
  const link = document.createElement('a');
  link.href = `assets/images/${certificateImage}`;
  link.download = `Craggy-Island-Trail-Certificate-${isBikeMode ? 'Cycle' : 'Car'}.jpg`;
  
  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

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
  console.log('Initializing button handlers...');
  
  const cycleTrailButton = document.querySelector('.transport-button.cycle-trail');
  const carTrailButton = document.querySelector('.transport-button.car-trail');
  
  console.log('Found buttons:', {
    cycleButton: cycleTrailButton ? 'yes' : 'no',
    carButton: carTrailButton ? 'yes' : 'no'
  });
  
  // Initialize buttons with white text
  if (cycleTrailButton) {
    cycleTrailButton.style.color = 'white';
    cycleTrailButton.dataset.trailType = 'cycle';
  }
  if (carTrailButton) {
    carTrailButton.style.color = 'white';
    carTrailButton.dataset.trailType = 'car';
  }
  
  if (cycleTrailButton) {
    cycleTrailButton.addEventListener('click', function() {
      console.log('Cycle Trail button clicked');
      // Remove active class from both buttons
      document.querySelectorAll('.transport-button').forEach(btn => {
        btn.classList.remove('active');
      });
      // Add active class to cycle button
      this.classList.add('active');
      // Set trail type
      AppState.activeTrail = 'cycle';
      showScreen('cycle-start-page');
    });
  }
  
  if (carTrailButton) {
    carTrailButton.addEventListener('click', function() {
      console.log('Car Trail button clicked');
      // Remove active class from both buttons
      document.querySelectorAll('.transport-button').forEach(btn => {
        btn.classList.remove('active');
      });
      // Add active class to car button
      this.classList.add('active');
      // Set trail type
      AppState.activeTrail = 'car';
      showScreen('car-start-page');
    });
  }
});

const amenitiesData = {
    "1": {
        categories: {
            "🍽️ Restaurants & Cafés": [
                {
                    name: "The Parochial House Café",
                    description: "Traditional Irish café serving tea, coffee, and homemade scones",
                    link: "https://www.google.com/maps"
                },
                {
                    name: "Bofey Quinns Bar & Restaurant",
                    description: "A cozy Irish pub offering traditional fare and a warm atmosphere. Located in Corofin.",
                    link: "https://www.google.com/maps/place/Bofey+Quinns+Bar+%26+Restaurant"
                }
            ],
            "⚡ Charging Stations": [
                {
                    name: "IONITY Network",
                    description: "High-power charging network across Europe. Find charging stations and plan your route.",
                    link: "https://www.ionity.eu/network"
                }
            ],
            "🛏️ Accommodation": [
                {
                    name: "Fergus View",
                    description: "A family-run B&B with stunning views of the Burren.",
                    link: "https://www.google.com/maps/place/Fergus+View"
                }
            ]
        }
    },
    "2": {
        categories: {
            "🍽️ Restaurants & Cafés": [
                {
                    name: "St. Kevin's Café",
                    description: "Cozy café with outdoor seating and local specialties",
                    link: "https://www.google.com/maps"
                },
                {
                    name: "Morrissey's of Doonbeg",
                    description: "Traditional Irish pub and restaurant.",
                    link: "https://www.google.com/maps/place/Morrissey's+of+Doonbeg"
                }
            ],
            "⚡ Charging Stations": [
                {
                    name: "IONITY Network",
                    description: "High-power charging network across Europe. Find charging stations and plan your route.",
                    link: "https://www.ionity.eu/network"
                }
            ],
            "🛏️ Accommodation": [
                {
                    name: "The Glendalough Hotel",
                    description: "Historic hotel in a scenic location.",
                    link: "https://www.google.com/maps/place/The+Glendalough+Hotel"
                }
            ]
        }
    },
    "3": {
        categories: {
            "🍽️ Restaurants & Cafés": [
                {
                    name: "Cave View Café",
                    description: "Scenic café with views of the surrounding landscape",
                    link: "https://www.google.com/maps"
                },
                {
                    name: "The Wild Atlantic Lodge",
                    description: "Offers seafood and Irish cuisine in a cozy setting.",
                    link: "https://www.google.com/maps/place/The+Wild+Atlantic+Lodge"
                }
            ],
            "⚡ Charging Stations": [
                {
                    name: "IONITY Network",
                    description: "High-power charging network across Europe. Find charging stations and plan your route.",
                    link: "https://www.ionity.eu/network"
                }
            ],
            "🛏️ Accommodation": [
                {
                    name: "Hazelwood Lodge",
                    description: "Comfortable lodging in a peaceful setting.",
                    link: "https://www.google.com/maps/place/Hazelwood+Lodge"
                }
            ]
        }
    },
    "4": {
        categories: {
            "🍽️ Restaurants & Cafés": [
                {
                    name: "Village Square Café",
                    description: "Traditional Irish café in the heart of the village",
                    link: "https://www.google.com/maps"
                },
                {
                    name: "Vaughan's Pub",
                    description: "Traditional Irish pub featured in 'Father Ted' episodes.",
                    link: "https://www.google.com/maps/place/Vaughan's+Pub"
                }
            ],
            "⚡ Charging Stations": [
                {
                    name: "IONITY Network",
                    description: "High-power charging network across Europe. Find charging stations and plan your route.",
                    link: "https://www.ionity.eu/network"
                }
            ],
            "🛏️ Accommodation": [
                {
                    name: "Kilcarragh House B&B",
                    description: "Comfortable rooms with a friendly atmosphere.",
                    link: "https://www.google.com/maps/place/Kilcarragh+House+B%26B"
                }
            ]
        }
    },
    "5": {
        categories: {
            "🍽️ Restaurants & Cafés": [
                {
                    name: "Cliff View Café",
                    description: "Café with spectacular views of the cliffs",
                    link: "https://www.google.com/maps"
                },
                {
                    name: "The Ivy Cottage",
                    description: "Seafood restaurant with a charming garden in Doolin.",
                    link: "https://www.google.com/maps/place/The+Ivy+Cottage"
                }
            ],
            "⚡ Charging Stations": [
                {
                    name: "IONITY Network",
                    description: "High-power charging network across Europe. Find charging stations and plan your route.",
                    link: "https://www.ionity.eu/network"
                }
            ],
            "🛏️ Accommodation": [
                {
                    name: "Cliffs of Moher Hotel",
                    description: "Modern hotel close to the cliffs in Liscannor.",
                    link: "https://www.google.com/maps/place/Cliffs+of+Moher+Hotel"
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

// Update transportation page content
document.addEventListener('DOMContentLoaded', () => {
  const transportationContent = document.querySelector('.transportation-content');
  if (transportationContent) {
    transportationContent.innerHTML = `
      <h1>Choose Your Journey</h1>
      <div class="welcome-text">
        <p>Welcome to The Craggy Island Trail, where you'll experience a new story from the world of Father Ted to guide you to iconic filming locations in County Clare.</p>
        <p><strong>Explore it your way.</strong></p>
      </div>
      
      <div class="transport-options">
        <div class="transport-option cycle">
          <div class="option-content">
            <p>Perfect for those who want to take their time and enjoy the Irish countryside.</p>
            <div class="trail-info">Estimated time: 3 Days</div>
          </div>
          <button class="transport-button cycle-trail" onclick="showScreen('start-page')">Cycling Trail</button>
        </div>
        
        <div class="transport-option car">
          <div class="option-content">
            <p>Offers users the opportunity to visit all locations in a day-trip.</p>
            <div class="trail-info">Estimated time: 6 Hours</div>
          </div>
          <button class="transport-button car-trail" onclick="showScreen('start-page')">Car Trail</button>
        </div>
      </div>
    `;
  }
});

function resetApp() {
  // Clear all state
  AppState.cycleTrail.completedChapters.clear();
  AppState.carTrail.completedChapters.clear();
  AppState.cycleTrail.progress = 0;
  AppState.carTrail.progress = 0;
  
  // Clear localStorage
  localStorage.removeItem('appState');
  
  // Clear all indicators
  AppState.clearAllIndicators();
  
  // Reset UI
  AppState.updateUI();
  
  // Return to start page
  showScreen('start-page');
}

function updateProgressBar(percentage) {
    const progressBar = document.querySelector('.progress-bar');
    const progressFill = document.querySelector('.progress-fill');
    const caravanIcon = document.querySelector('.caravan-icon');
    const progressText = document.querySelector('.progress-text');
    
    if (!progressBar || !progressFill || !caravanIcon || !progressText) return;
    
    // Update progress fill width
    progressFill.style.width = `${percentage}%`;
    
    // Update caravan position
    const barWidth = progressBar.offsetWidth;
    const caravanPosition = (percentage / 100) * barWidth;
    caravanIcon.style.left = `${caravanPosition}px`;
    
    // Update progress text
    progressText.textContent = `${Math.round(percentage)}%`;
    
    // Update color based on progress
    if (percentage >= 80) {
        progressFill.style.backgroundColor = '#4CAF50'; // Green
    } else if (percentage >= 40) {
        progressFill.style.backgroundColor = '#FF9800'; // Orange
    } else {
        progressFill.style.backgroundColor = '#FF0000'; // Red
    }
}

function calculateRoute(origin, destination) {
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true
    });

    const request = {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true
    };

    directionsService.route(request, (result, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);
            const route = result.routes[0];
            const leg = route.legs[0];
            
            // Update distance and duration
            document.getElementById('distance').textContent = leg.distance.text;
            document.getElementById('duration').textContent = leg.duration.text;
            
            // Update progress bar
            updateProgressBar(100);
        } else {
            console.error('Directions request failed:', status);
            // Fallback to static route display
            const path = [
                { lat: origin.lat, lng: origin.lng },
                { lat: destination.lat, lng: destination.lng }
            ];
            
            const routeLine = new google.maps.Polyline({
                path: path,
                geodesic: true,
                strokeColor: '#FF0000',
                strokeOpacity: 1.0,
                strokeWeight: 2
            });
            
            routeLine.setMap(map);
            
            // Calculate approximate distance
            const distance = google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(origin.lat, origin.lng),
                new google.maps.LatLng(destination.lat, destination.lng)
            );
            
            // Update distance and duration with approximate values
            document.getElementById('distance').textContent = Math.round(distance / 1000) + ' km';
            document.getElementById('duration').textContent = Math.round(distance / 1000 * 2) + ' mins';
            
            // Update progress bar
            updateProgressBar(100);
        }
    });
}

// Function to show cycling disclaimer
function showCyclingDisclaimer() {
    const popup = document.createElement('div');
    popup.className = 'popup-overlay';
    popup.innerHTML = `
        <div class="popup-content">
            <h3>Cycling Trail Preparation</h3>
            <div class="disclaimer-content">
                <p><strong>Before you begin your cycling adventure, please ensure you are prepared:</strong></p>
                <ul>
                    <li>Check the weather forecast and dress appropriately</li>
                    <li>Carry essential spare parts (inner tubes, pump, basic tools)</li>
                    <li>Bring sufficient water and snacks</li>
                    <li>Ensure your bike is in good working condition</li>
                    <li>Wear appropriate safety gear (helmet, reflective clothing)</li>
                </ul>
                <p><strong>Local Bike Shops:</strong></p>
                <ul>
                    <li>Craggy Island Cycles - Emergency repairs and parts</li>
                    <li>County Clare Bikes - Full service and rentals</li>
                </ul>
            </div>
            <button class="popup-button" onclick="this.parentElement.parentElement.remove()">Close</button>
        </div>
    `;
    document.body.appendChild(popup);
}

// Add cycling disclaimer button to cycle start page
document.addEventListener('DOMContentLoaded', () => {
    const cycleStartPage = document.getElementById('cycle-start-page');
    if (cycleStartPage) {
        const startButton = cycleStartPage.querySelector('#start-trail-button');
        if (startButton) {
            const disclaimerButton = document.createElement('button');
            disclaimerButton.className = 'disclaimer-button';
            disclaimerButton.textContent = 'Cycling Trail Preparation';
            disclaimerButton.onclick = showCyclingDisclaimer;
            startButton.parentNode.insertBefore(disclaimerButton, startButton);
        }
    }
});

// Update location facts with more historical and interesting content
const locationFacts = {
    "1": [
        "The Parochial House was built in 1825 as a rectory for the local Church of Ireland, featuring original Georgian architecture and a hidden priest hole from the penal times.",
        "The Burren region is a UNESCO Global Geopark, containing 75% of Ireland's native plant species and rare Arctic-Alpine flowers that have survived since the last Ice Age.",
        "St. Joseph's Church, constructed in 1835, features a unique 'leaning tower' that has maintained its 5-degree tilt since the Great Famine, when its foundation shifted.",
        "The area's limestone landscape was formed 350 million years ago when Ireland was located near the equator, creating the largest karst landscape in Western Europe."
    ],
    "2": [
        "Bofey Quinns pub, established in 1864, was originally a coaching inn where travelers could rest their horses. Its original Victorian interior includes a rare working gas lamp system.",
        "Doonbeg Castle, built in 1560 by the O'Brien clan, was strategically positioned to control the local fishing trade. Its walls are 8 feet thick and contain secret passages.",
        "The area's unique microclimate, created by the Gulf Stream, allows Mediterranean plants like the rare Dense-flowered Orchid to grow alongside native Irish species.",
        "The local beach contains a 17th-century Spanish Armada shipwreck, and during low tide, you can still see remnants of the vessel's timbers in the sand."
    ],
    "3": [
        "The Wild Atlantic Lodge was built in 1812 as a coastguard station during the Napoleonic Wars. Its thick walls and watchtower were designed to spot French invasion attempts.",
        "The Poll na Gollum cave system, discovered in 1835, extends over 2 kilometers and contains rare stalactite formations that grow only 1 centimeter every 100 years.",
        "The area's beaches host one of Ireland's largest seal colonies, with over 200 grey seals. The colony has been documented since the 12th century in local monastic records.",
        "Local fishermen still use traditional currach boats, a design unchanged since the Bronze Age. Each boat takes 3 months to build using techniques passed down through generations."
    ],
    "4": [
        "Vaughan's Pub has been in the same family since 1865 and uses its original 19th-century bar, made from a single piece of mahogany imported from Honduras in 1870.",
        "The village's round tower, built in 950 AD, is one of Ireland's best-preserved early Christian structures. Its 30-meter height was used as a lookout point during Viking raids.",
        "The market square has hosted weekly markets since 1780, making it one of Ireland's oldest continuous market sites. The original market cross, dating from 1200 AD, still stands.",
        "The area's ancient ring forts, dating from 500-1000 AD, are aligned with significant astronomical events. The largest fort, 40 meters in diameter, was a royal residence of the O'Brien kings."
    ],
    "5": [
        "The Cliffs of Moher are 320 million years old and contain fossils from the Carboniferous period, including ancient sea creatures that lived when Ireland was part of a tropical sea.",
        "The visitor center, completed in 2007, is built into the hillside to minimize environmental impact. Its design won the International Architecture Award for its innovative use of local stone.",
        "The area's unique geology creates a natural sound chamber, where waves can be heard from over a kilometer away. This phenomenon was documented by early Christian monks in 800 AD.",
        "Local legend claims the cliffs were formed when the giant Fionn mac Cumhaill took a bite out of the landscape. The 'bite' created the famous sea stack known as Branaunmore."
    ]
};