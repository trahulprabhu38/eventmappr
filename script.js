const events = [
  { name: "Community Cleanup", type: "Volunteering", lat: 28.604047, lng: 77.227003 },
  { name: "Local Music Night", type: "Music", lat: 28.626646, lng: 77.190096 },
  { name: "Tech Meetup", type: "Technology", lat: 28.613999, lng: 77.226603 },
  { name: "Farmers Market", type: "Market", lat: 28.616373, lng: 77.204582 },
  { name: "Art & Craft Fair", type: "Art", lat: 28.601078, lng: 77.208121 },
];

// Load dynamic events from localStorage
function loadDynamicEvents() {
  const dynamicEvents = JSON.parse(localStorage.getItem('dynamicEvents') || '{}');
  Object.values(dynamicEvents).forEach(event => {
    // Check if event already exists to avoid duplicates
    const exists = events.find(e => e.name === event.name);
    if (!exists) {
      events.push(event);
    }
  });
}

// Load dynamic events when page loads
loadDynamicEvents();

let map = L.map("map").setView([28.6139, 77.2090], 13);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; OpenStreetMap contributors',
}).addTo(map);

const markerGroup = L.layerGroup().addTo(map);

function renderMarkers(filteredEvents) {
  markerGroup.clearLayers();
  filteredEvents.forEach(event => {
    const marker = L.marker([event.lat, event.lng])
      .addTo(markerGroup);
    
    // Create enhanced popup content with better styling
    const popupContent = `
      <div style="
        text-align: center; 
        min-width: 250px; 
        padding: 5px;
        font-family: 'Poppins', sans-serif;
      ">
        <div style="
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          padding: 15px;
          border-radius: 15px 15px 0 0;
          margin: -5px -5px 10px -5px;
        ">
          <strong style="font-size: 18px; font-weight: 600;">${event.name}</strong>
        </div>
        <div style="padding: 0 10px;">
          <div style="
            display: inline-block;
            background: rgba(102, 126, 234, 0.1);
            color: #667eea;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: 500;
            margin-bottom: 15px;
          ">
            ${event.type}
          </div>
          <br>
          <a href="event-details.html?event=${encodeURIComponent(event.name)}" 
             style="
               background: linear-gradient(135deg, #667eea, #764ba2);
               color: white; 
               padding: 10px 20px; 
               text-decoration: none; 
               border-radius: 25px; 
               font-size: 14px; 
               font-weight: 500;
               display: inline-block; 
               margin-top: 5px; 
               transition: all 0.3s ease;
               box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
             "
             onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(102, 126, 234, 0.4)';"
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(102, 126, 234, 0.3)';"
          >
            <i class="fas fa-info-circle" style="margin-right: 5px;"></i>
            View Details
          </a>
        </div>
      </div>
    `;
    
    marker.bindPopup(popupContent, {
      maxWidth: 300,
      className: 'custom-popup'
    });
    
    // Remove the automatic redirect - only popup will show
  });
}

renderMarkers(events);

document.getElementById("eventForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const name = document.getElementById("eventName").value;
  const type = document.getElementById("eventType").value;

  map.once("click", function (event) {
    const { lat, lng } = event.latlng;
    const newEvent = { 
      name, 
      type, 
      lat, 
      lng,
      // Add additional details for new events
      description: `A ${type.toLowerCase()} event. More details coming soon!`,
      address: "Location details to be announced",
      dateTime: "Date and time to be announced",
      organizer: "Event Organizer",
      contact: "Contact information to be announced",
      photos: [] // Initialize empty photos array
    };
    events.push(newEvent);
    
    // Save to localStorage for persistence
    const dynamicEvents = JSON.parse(localStorage.getItem('dynamicEvents') || '{}');
    dynamicEvents[name] = newEvent;
    localStorage.setItem('dynamicEvents', JSON.stringify(dynamicEvents));
    
    renderMarkers(events);
    
    // Show success message with option to view details
    const viewDetails = confirm("Event added successfully! Would you like to view the event details and add photos?");
    if (viewDetails) {
      window.location.href = `event-details.html?event=${encodeURIComponent(name)}`;
    }
    
    document.getElementById("eventForm").reset();
  });

  alert("Now click on the map to place your event.");
});

document.getElementById("filterType").addEventListener("change", function () {
  const selected = this.value;
  if (selected === "All") {
    renderMarkers(events);
  } else {
    const filtered = events.filter(e => e.type === selected);
    renderMarkers(filtered);
  }
});

document.getElementById("locateBtn").addEventListener("click", function () {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      map.setView([userLat, userLng], 14);

      const nearbyEvents = events.filter(e => {
        const distance = getDistance(userLat, userLng, e.lat, e.lng);
        return distance <= 2; // 2 km
      });

      renderMarkers(nearbyEvents);
      alert(`Found ${nearbyEvents.length} nearby events within 2km.`);
    },
    () => {
      alert("Unable to retrieve your location.");
    }
  );
});

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
