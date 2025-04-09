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

// Add chapter image mapping
const chapterImages = {
  "1": "assets/images/father-ted-house.jpg",
  "2": "assets/images/st-kevins-stump.jpg",
  "3": "assets/images/aillwee-cave.jpg",
  "4": "assets/images/kilfenora-village.jpg",
  "5": "assets/images/cliffs-of-moher.jpg"
};

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
          <p>You've completed all chapters of the Father Ted Trail!</p>
          <p>You've had your fun, and that's all that matters.</p>
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
  console.log('Showing screen:', screenId);
  
  // Remove active class from all screens
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  
  // Show target screen
  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    console.log('Found target screen:', screenId);
    targetScreen.classList.add('active');
    
    // Track navigation history
    if (screenId !== "settings-page") {
      navigationStack.push(screenId);
    }
    
    // Toggle button group visibility for all screens except intro
    const buttonGroup = document.querySelector('.button-group');
    if (buttonGroup) {
      buttonGroup.style.display = screenId === 'intro-screen' ? 'none' : 'flex';
    }
    
    // Initialize buttons if showing chapter selection page
    if (screenId === 'chapter-selection-page') {
      initializeButtonHandlers();
    }
  } else {
    console.error(`Screen ${screenId} not found`);
    console.log('Available screens:', Array.from(document.querySelectorAll('.screen')).map(s => s.id));
  }
}

// Load GeoJSON data for the selected chapter
function loadChapterData(chapterNumber) {
  console.log(`Loading chapter ${chapterNumber} data...`);
  
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
    window.markers.forEach(marker => marker.setMap(null));
  }
  window.markers = [];
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
      description: "Visit the iconic parochial house where Father Ted, Dougal, and Jack lived. Don't forget to have a nice cup of tea!",
      narrative: "Father Dougal hasn't been showing up to mass lately. Let's start our search at the parochial house. Maybe he's just having a lie-in?",
      arrivalText: "I'm here",
      location: { lat: 52.9719, lng: -9.4264 },
      image: "assets/images/father-ted-house.jpg"
    },
    "2": {
      title: "St Kevin's Stump",
      description: "Explore the mysterious stump where our favorite priests got lost picking mushrooms. Was it really haunted, or were the mushrooms... special?",
      narrative: "Mrs. Doyle mentioned seeing Dougal near the stump. He was looking for mushrooms... or was he looking for something else?",
      arrivalText: "I'm here",
      location: { lat: 52.9719, lng: -9.4264 },
      image: "assets/images/stump.jpg"
    },
    "3": {
      title: "Aillwee Cave",
      description: "Visit the famous cave system where Father Ted had his memorable encounter with Richard Wilson. I don't belieeeve it!",
      narrative: "A local farmer saw someone matching Dougal's description entering the cave. He was carrying a torch and muttering about 'the truth being out there'...",
      arrivalText: "I'm here",
      location: { lat: 53.0719, lng: -9.3264 },
      image: "assets/images/cave.jpg"
    },
    "4": {
      title: "Kilfenora Village",
      description: "Take a tour through Kilfenora Village, where you'll find Mrs. O'Reilly's house, Pat Mustard's milk route, and the pub where Ted met the Chinese community.",
      narrative: "Mrs. O'Reilly mentioned seeing Dougal at the pub. He was trying to explain something about 'the Chinese' to everyone...",
      arrivalText: "I'm here",
      location: { lat: 52.9719, lng: -9.4264 },
      image: "assets/images/kilfenora.jpg"
    },
    "5": {
      title: "Cliffs of Moher",
      description: "Experience the majestic Cliffs of Moher and Moher Tower, featured in the 'Tentacles of Doom' episode. Mind the edge!",
      narrative: "Just got a call from Dougal! He's at Kilkelly Caravan Park, trying to convince everyone that the milkman is actually an alien. He says he's been following the trail of milk bottles across Clare...",
      arrivalText: "I'm here",
      location: { lat: 52.9719, lng: -9.4264 },
      image: "assets/images/cliffs.jpg"
    }
  };

  const data = chapterData[chapterNumber] || { 
    title: `Chapter ${chapterNumber}`, 
    description: "Description not available",
    narrative: "Narrative not available",
    arrivalText: "Arrival text not available",
    location: { lat: 0, lng: 0 },
    image: "assets/images/default.jpg"
  };

  document.getElementById('chapter-number').textContent = `Chapter ${chapterNumber}`;
  document.getElementById('chapter-title').textContent = data.title;
  document.getElementById('chapter-description').textContent = data.description;
  document.getElementById('chapter-narrative').textContent = data.narrative;
  document.getElementById('chapter-image').src = data.image;
  document.getElementById('im-here').textContent = data.arrivalText;
  
  console.log('Chapter info updated:', data);
}

// Function to initialize the map and display user location
function initMap() {
  const mapElement = document.getElementById('map');
  const chapterId = parseInt(mapElement.dataset.chapterId, 10);

  map = new google.maps.Map(mapElement, {
    center: { lat: 52.9715, lng: -9.4262 }, // Default center
    zoom: 12,
  });

  // Add user location marker
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        userMarker = new google.maps.Marker({
          position: userLocation,
          map: map,
          icon: 'assets/images/user-icon.png', // Use a dummy icon if no custom icon is available
          title: 'Your Location',
        });
        map.setCenter(userLocation);
      },
      (error) => {
        console.error('Error fetching user location:', error);
      }
    );
  } else {
    console.warn('Geolocation is not supported by this browser.');
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
  const currentScreen = document.querySelector(".screen.active");
  const previousScreen = navigationSequence[currentScreen.id];
  
  if (currentScreen.id === "settings-page") {
    // For settings page, go back to the most recently visited page
    const lastScreen = navigationStack[navigationStack.length - 1];
    if (lastScreen) {
      showScreen(lastScreen);
    }
  } else if (previousScreen) {
    showScreen(previousScreen);
    
    // Stop music if going back to intro screen
    if (previousScreen === "intro-screen") {
      const music = document.getElementById("background-music");
      music.pause();
      music.currentTime = 0;
    }
  }
}

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
  "1": "Is this the real Father Ted's House? The very place where Mrs. Doyle made all that tea?",
  "2": "Have you found St Kevin's Stump? The one that got Ted and Dougal lost?",
  "3": "Are you at Aillwee Cave? The place of the famous 'I don't belieeeve it!' scene?",
  "4": "Is this Kilfenora Village? Home of the infamous milk float incident?",
  "5": "Are these the mighty Cliffs of Moher? Where the 'Tentacles of Doom' episode was filmed?"
};

// Chapter-specific congratulation messages
const congratulationMessages = {
  "1": "That's the house alright! 'Would you like a cup of tea, Father?' - Mrs. Doyle would be proud!",
  "2": "You've found St Kevin's Stump! 'These mushrooms are a bit mad, Ted!' - Just don't eat any strange fungi...",
  "3": "I don't belieeeve it! You've made it to Aillwee Cave! Richard Wilson would be so proud!",
  "4": "Welcome to Kilfenora! 'The Chinese: A Great Bunch of Lads!' - Mind the milk floats and watch out for Pat Mustard!",
  "5": "Careful now! Down with this sort of thing! You've conquered the Cliffs of Moher!"
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
  document.getElementById('disclaimer-popup').style.display = 'block';
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

window.addEventListener('load', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        console.log('User location accessed:', position.coords);
      },
      error => {
        console.error('Error accessing user location:', error);
      }
    );
  } else {
    console.warn('Geolocation is not supported by this browser.');
  }
});

document.querySelectorAll('.chapter-button').forEach((button) => {
  button.addEventListener('click', () => {
    const chapterId = button.dataset.chapter;
    const chapterPage = document.getElementById('chapter-page');

    // Set chapter-specific data
    document.getElementById('chapter-number').textContent = `Chapter ${chapterId}`;
    document.getElementById('map').dataset.chapterId = chapterId;

    // Scroll to top
    window.scrollTo(0, 0);

    // Show chapter page
    document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('active'));
    chapterPage.classList.add('active');

    // Initialize map for the chapter
    loadChapterData(chapterId);
  });
});

document.querySelectorAll('.chapter-button').forEach((button) => {
  button.addEventListener('click', () => {
    const chapterId = button.dataset.chapter;
    const chapterPage = document.getElementById('chapter-page');

    // Set chapter-specific data
    document.getElementById('chapter-number').textContent = `Chapter ${chapterId}`;
    document.getElementById('map').dataset.chapterId = chapterId;

    // Scroll to top
    window.scrollTo(0, 0);

    // Show chapter page
    document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('active'));
    chapterPage.classList.add('active');

    // Initialize map for the chapter
    loadChapterData(chapterId);
  });
});

window.addEventListener('load', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        console.log('User location accessed:', position.coords);
      },
      error => {
        console.error('Error accessing user location:', error);
      }
    );
  } else {
    console.warn('Geolocation is not supported by this browser.');
  }
});

document.querySelectorAll('.chapter-button').forEach((button) => {
  button.addEventListener('click', () => {
    const chapterId = button.dataset.chapter;
    const chapterPage = document.getElementById('chapter-page');

    // Set chapter-specific data
    document.getElementById('chapter-number').textContent = `Chapter ${chapterId}`;
    document.getElementById('map').dataset.chapterId = chapterId;

    // Scroll to top
    window.scrollTo(0, 0);

    // Show chapter page
    document.querySelectorAll('.screen').forEach((screen) => screen.classList.remove('active'));
    chapterPage.classList.add('active');

    // Initialize map for the chapter
    loadChapterData(chapterId);
  });
});