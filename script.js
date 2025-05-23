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
  "start-page": "intro-screen",
  "chapter-selection-page": "start-page",
  "chapter-page": "chapter-selection-page",
  "arrival-page": "chapter-page",
  "settings-page": ["start-page", "chapter-selection-page"] // Can go back to either page
};

// Define chapter images with correct relative paths
const chapterImages = {
  '1': 'assets/images/Chapters/father-ted-house.jpg',
  '2': 'assets/images/Chapters/st-kevins-stump.jpg',
  '3': 'assets/images/Chapters/aillwee-cave.jpg',
  '4': 'assets/images/Chapters/kilfenora-village.jpg',
  '5': 'assets/images/Chapters/cliffs-of-moher.jpg',
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

  // Hide all screens
  document.querySelectorAll('.screen').forEach((screen) => {
    screen.classList.remove('active');
  });

  // Show the target screen
  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.classList.add('active');
    handleBackgroundMusic(screenId); // Handle background music
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
  
  const chapterData = {
    "1": {
      title: "Father Ted's House",
      description: "Visit the iconic parochial house where Father Ted, Dougal, and Jack lived.",
      narrative: "Ted wakes up to find the Holy Stone (which was being stored very securely in a biscuit tin under Father Jack's chair) has vanished. The only remains are an empty biscuit tin, and Dougal remembers seeing a very “cool-looking priest” in the night, but also says he might have dreamed it.",
      arrivalText: "I'm here",
      location: { lat: 52.9719, lng: -9.4264 },
      image: "assets/images/Chapters/father-ted-house.jpg" // Corrected path
    },
    "2": {
      title: "St Kevin's Stump",
      description: "St. Kevin's Stump, which was basically a tree stump, is no longer here, but you will find the Rock that Ted and Dougal climbed.",
      narrative: "By the rock, a local man reports seeing a “young priest with an earring” listening to Oasis. Ted finds a flyer wedged in the stump for a “Pop-Up Priest Rave & Blessing Session” hosted in Aillwee Cave.",
      arrivalText: "I'm here",
      location: { lat: 52.9719, lng: -9.4264 },
      image: "assets/images/Chapters/st-kevins-stump.jpg" // Corrected path
    },
    "3": {
      title: "Aillwee Cave",
      description: "The caves appear in the Father Ted episode 'The Mainland' under the name 'The Very Dark Caves'.",
      narrative: "In the depths of Aillwee Cave (The Very Dark Caves), Ted and Dougal get lost (it's very dark), but Dougal finds a receipt near the entrance. Someone too badass to use a bin, perhaps?",
      arrivalText: "I'm here",
      location: { lat: 53.0719, lng: -9.3264 },
      image: "assets/images/Chapters/aillwee-cave.jpg" // Corrected path
    },
    "4": {
      title: "Kilfenora Village",
      description: "Kilfenora Village is where you'll find Mrs. O'Reilly's house, Pat Mustard's milk route, and the pub where Ted met the Chinese community.",
      narrative: "Inside Vaughan's pub, Ted asks the bartender if he's seen the Holy Stone. The bartender shrugs: ''Yeah, a priest came in this morning with some kind of stone. Claimed it was blessed and tried to trade it for my leather jacket. He said, 'I'd rather throw it in the sea than give it back to those eejits.'''",
      arrivalText: "I'm here",
      location: { lat: 52.9719, lng: -9.4264 },
      image: "assets/images/Chapters/kilfenora-village.jpg" // Corrected path
    },
    "5": {
      title: "Cliffs of Moher",
      description: "Experience the Cliffs of Moher and Moher Tower, featured in the 'Tentacles of Doom' episode.",
      narrative: "Ted and Dougal arrive breathless, but they're too late. A crowd witnessed a priest launch the stone into the crashing waves below. The priest is gone too. Something about this seems all too familiar. Bishop Brennan is calling. He wants answers. Who stole the Holy Stone of Clonrichert?",
      arrivalText: "I'm here",
      location: { lat: 52.9719, lng: -9.4264 },
      image: "assets/images/Chapters/cliffs-of-moher.jpg" // Corrected path
    }
  };

  const data = chapterData[chapterNumber] || { 
    title: `Chapter ${chapterNumber}`, 
    description: "Description not available",
    narrative: "Narrative not available",
    arrivalText: "Arrival text not available",
    location: { lat: 0, lng: 0 },
    image: "assets/images/Chapters/default.jpg" // Corrected default path
  };

  document.getElementById('chapter-number').textContent = `Chapter ${chapterNumber}`;
  document.getElementById('chapter-title').textContent = data.title;
  document.getElementById('chapter-description').textContent = data.description;
  document.getElementById('chapter-narrative').textContent = data.narrative;
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
  const previousScreen = navigationSequence[currentScreen.id];

  if (Array.isArray(previousScreen)) {
    // If multiple possible previous screens, default to the start page
    showScreen('start-page');
  } else if (previousScreen) {
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
        startTrailButton.addEventListener('click', () => {
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

    // Chapter buttons handler
    document.querySelectorAll('.chapter-button').forEach(button => {
        button.addEventListener('click', function() {
            const chapterNum = this.getAttribute('data-chapter');
            if (!chapterNum) return;

            // Play chapter-specific sound effect
            playSound(`chapter${chapterNum}Click`);

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
document.querySelectorAll(".chapter-button").forEach(button => {
    const chapterNum = button.getAttribute('data-chapter');
    const isCompleted = AppState.isChapterCompleted(chapterNum);
    
    // Remove existing completion-related elements
    button.classList.remove('completed');
    let checkmark = button.querySelector('.completion-checkmark');
    if (checkmark) {
      checkmark.remove();
    }
    
    // Create new checkmark
    checkmark = document.createElement('span');
    checkmark.className = 'completion-checkmark';
    checkmark.textContent = '✓';
    button.appendChild(checkmark);
    
    if (isCompleted) {
      button.classList.add('completed');
    }
  });
}

// Helper function to get chapter titles
function getChapterTitle(chapterNumber) {
  const titles = {
    "1": "Chapter 1: Father Ted's House",
    "2": "Chapter 2: St Kevin's Stump",
    "3": "Chapter 3: Aillwee Cave",
    "4": "Chapter 4: Kilfenora Village",
    "5": "Chapter 5: Cliffs of Moher"
  };
  return titles[chapterNumber] || `Chapter ${chapterNumber}`;
}

// Helper function to get chapter descriptions
function getChapterDescription(chapterNumber) {
  const descriptions = {
    "1": "Begin your journey at the iconic parochial house where Father Ted, Dougal, and Jack lived. Don't forget to have a nice cup of tea!",
    "2": "Explore the mysterious stump where our favorite priests got lost picking mushrooms. Was it really haunted, or were the mushrooms... special?",
    "3": "Visit the famous cave system where Father Ted had his memorable encounter with Richard Wilson. I don't belieeeve it!",
    "4": "Take a tour through Kilfenora Village, where you'll find Mrs. O'Reilly's house, Pat Mustard's milk route, and the pub where Ted met the Chinese community.",
    "5": "End your journey at the majestic Cliffs of Moher, where the infamous 'Tentacles of Doom' episode was filmed. Watch out for any wayward bishops!"
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
}

// Helper function to update slider colors
function updateSliderColors(slider, variableName) {
  const value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
  document.documentElement.style.setProperty(`--${variableName}`, `${value}%`);
}

// Add these functions near the top of the file
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

// Add reset function
function resetAppState() {
  console.log('Resetting app state...');
  localStorage.removeItem('appState');
  AppState.init();
  updateChapterButtons();
  showScreen('intro-screen');
}

// Function to handle background music based on the active screen
function handleBackgroundMusic(screenId) {
  const backgroundMusic = document.getElementById('background-music');
  if (!backgroundMusic) return;

  // Play music on the intro, start, settings, and chapter selection pages
  if (screenId === 'intro-screen' || screenId === 'start-page' || screenId === 'settings-page' || screenId === 'chapter-selection-page') {
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
      <p class="welcome-text">
        <strong>Welcome to The Craggy Island Trail, which will guide you to iconic Father Ted filming locations in County Clare.</strong>
        <br><br>
        Before you start, you should know that the Holy Stone of Clonrichert has mysteriously disappeared, and Bishop Brennan demands answers!
      </p>
    `;
  }
});

// Update the DOMContentLoaded event listener
document.addEventListener("DOMContentLoaded", () => {
  console.log('DOM Content Loaded');
  
  // Reset app state on initial load
  resetAppState();
  
  // Hide all screens first
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  
  // Show intro screen
  const introScreen = document.getElementById('intro-screen');
  if (introScreen) {
    console.log('Showing intro screen');
    introScreen.classList.add('active');
    
    // Add click handler
    const handleIntroClick = () => {
      console.log('Intro screen clicked');
      if (window.transitionTimeout) {
        clearTimeout(window.transitionTimeout);
        window.transitionTimeout = null;
      }
      showScreen('start-page');
      introScreen.removeEventListener('click', handleIntroClick);
    };
    
    introScreen.addEventListener('click', handleIntroClick);
    
    // Set auto transition
    window.transitionTimeout = setTimeout(() => {
      console.log('Auto transitioning to start page');
      showScreen('start-page');
      introScreen.removeEventListener('click', handleIntroClick);
    }, 6000);
  }
  
  // Initialize start trail button handler
  const startTrailButton = document.getElementById('start-trail-button');
  if (startTrailButton) {
    startTrailButton.addEventListener('click', () => {
      console.log('Start Trail button clicked');
      showScreen('chapter-selection-page');
    });
  }

  // Initialize state
  AppState.init();
  
loadProgress();
  initializeButtonHandlers();
  initializeSettings();
  testChapterLoading();
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