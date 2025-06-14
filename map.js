// map.js - OpenStreetMap + Leaflet Implementation
class MapSystem {
  constructor() {
    this.map = null;
    this.markers = [];
    this.selectedLocation = null;
    this.initMapSystem();
  }

  // Initialize map system
  async initMapSystem() {
    // Load Leaflet dynamically if not already loaded
    if (!window.L) {
      await this._loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
      await this._loadStyle('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
    }

    // Initialize appropriate map based on page
    if (document.getElementById('liveMap')) {
      this.initLiveMap();
    }

    if (document.getElementById('locationMap')) {
      this.initLocationPicker();
    }
  }

  // Initialize live issues map
  initLiveMap() {
    this.map = L.map('liveMap').setView([40.7128, -74.0060], 13); // Default NYC coordinates

    // Base map layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Add sample issue markers (replace with real data)
    this.addSampleIssues();

    // Add layer control
    this._addLayerControl();

    // Add scale control
    L.control.scale().addTo(this.map);
  }

  // Initialize location picker map
  initLocationPicker() {
    this.map = L.map('locationMap').setView([40.7128, -74.0060], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Click handler for location selection
    this.map.on('click', (e) => {
      this.setSelectedLocation(e.latlng);
    });

    // Current location button
    document.getElementById('getLocationBtn')?.addEventListener('click', () => {
      this._getCurrentLocation();
    });
  }

  // Set selected location with marker
  setSelectedLocation(latlng) {
    this.clearMarkers();
    this.selectedLocation = latlng;

    const marker = L.marker(latlng, {
      draggable: true,
      icon: this._getCustomMarkerIcon('selected')
    }).addTo(this.map);

    marker.on('dragend', () => {
      this.selectedLocation = marker.getLatLng();
      this._updateLocationForm();
    });

    this.markers.push(marker);
    this._updateLocationForm();
  }

  // Add sample issue markers (replace with API data)
  addSampleIssues() {
    const issues = [
      { lat: 40.7128, lng: -74.0060, type: 'pothole', status: 'pending' },
      { lat: 40.7218, lng: -74.0160, type: 'garbage', status: 'resolved' },
      { lat: 40.7058, lng: -74.0080, type: 'streetlight', status: 'in-progress' }
    ];

    issues.forEach(issue => {
      const marker = L.marker([issue.lat, issue.lng], {
        icon: this._getStatusIcon(issue.status)
      }).bindPopup(this._createPopupContent(issue))
        .addTo(this.map);
      
      this.markers.push(marker);
    });

    // Optional: Add marker clustering
    this._addMarkerClustering();
  }

  // Clear all markers
  clearMarkers() {
    this.markers.forEach(marker => {
      this.map.removeLayer(marker);
    });
    this.markers = [];
  }

  // ======================
  // PRIVATE HELPER METHODS
  // ======================

  // Get current geolocation
  async _getCurrentLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      const location = L.latLng(
        position.coords.latitude, 
        position.coords.longitude
      );
      
      this.setSelectedLocation(location);
      this.map.flyTo(location, 15);
    } catch (err) {
      console.error("Geolocation error:", err);
      alert(`Error getting location: ${err.message}`);
    }
  }

  // Update location form field
  _updateLocationForm() {
    if (!this.selectedLocation || !document.getElementById('locationCoords')) return;
    
    document.getElementById('locationCoords').value = 
      `${this.selectedLocation.lng.toFixed(6)},${this.selectedLocation.lat.toFixed(6)}`;
  }

  // Create marker icon based on status
  _getStatusIcon(status) {
    const colors = {
      'pending': '#FFC107',
      'in-progress': '#1976D2',
      'resolved': '#28A745',
      'rejected': '#DC3545'
    };

    return L.divIcon({
      html: `<div class="leaflet-marker-icon" style="background-color: ${colors[status] || '#6C757D'}"></div>`,
      className: 'custom-marker',
      iconSize: [24, 24]
    });
  }

  // Create custom marker icon
  _getCustomMarkerIcon(type) {
    return L.divIcon({
      html: `<div class="leaflet-marker-icon ${type}"></div>`,
      className: 'custom-marker',
      iconSize: [32, 32]
    });
  }

  // Create popup content for issues
  _createPopupContent(issue) {
    return `
      <div class="map-popup">
        <h6>${this._capitalize(issue.type)}</h6>
        <p>Status: <span class="badge" style="background-color: ${this._getStatusColor(issue.status)}">
          ${this._formatStatus(issue.status)}
        </span></p>
        <button class="btn btn-sm btn-outline-primary w-100 mt-2" data-issue-id="${issue.id || ''}">
          View Details
        </button>
      </div>
    `;
  }

  // Add layer control
  _addLayerControl() {
    const baseLayers = {
      "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
      "Satellite": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}')
    };

    L.control.layers(baseLayers).addTo(this.map);
  }

  // Add marker clustering (optional)
  _addMarkerClustering() {
    const markerClusterGroup = L.markerClusterGroup({
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true
    });

    this.markers.forEach(marker => {
      markerClusterGroup.addLayer(marker);
    });

    this.map.addLayer(markerClusterGroup);
  }

  // Helper: Capitalize string
  _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Helper: Format status
  _formatStatus(status) {
    return status.split('-').map(this._capitalize).join(' ');
  }

  // Helper: Get status color
  _getStatusColor(status) {
    const colors = {
      'pending': '#FFC107',
      'in-progress': '#1976D2',
      'resolved': '#28A745',
      'rejected': '#DC3545'
    };
    return colors[status] || '#6C757D';
  }

  // Helper: Load script dynamically
  _loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Helper: Load style dynamically
  _loadStyle(href) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('liveMap') || document.getElementById('locationMap')) {
    new MapSystem();
  }
});