/**
 * Map Integration Module for Solar Chauffeur
 * Handles interactive Leaflet map with draggable markers
 */

class MapIntegration {
    constructor(campusData, locationServices) {
        // Validate dependencies
        if (!campusData) {
            throw new Error('CampusData instance is required');
        }
        if (!locationServices) {
            throw new Error('LocationServices instance is required');
        }
        if (typeof campusData.getCampusCenter !== 'function') {
            throw new Error('CampusData.getCampusCenter method is not available');
        }
        
        this.campusData = campusData;
        this.locationServices = locationServices;
        this.map = null;
        this.pickupMarker = null;
        this.dropoffMarker = null;
        this.campusMarkers = [];
        this.userLocationMarker = null;
        this.initialized = false;
        this.retryCount = 0;
        this.maxRetries = 50; // 5 seconds max wait time
        
        this.waitForLeaflet();
    }

    /**
     * Wait for Leaflet to be available
     */
    waitForLeaflet() {
        const checkLeaflet = () => {
            this.retryCount++;
            
            if (typeof L !== 'undefined') {
                this.initMap();
            } else if (this.retryCount < this.maxRetries) {
                setTimeout(checkLeaflet, 100);
            } else {
                this.showMapError('Leaflet map library failed to load. Please refresh the page.');
            }
        };
        checkLeaflet();
    }

    /**
     * Initialize the Leaflet map
     */
    initMap() {
        try {
            if (this.initialized || this.map) {
                return;
            }

            // Check if Leaflet is available
            if (typeof L === 'undefined') {
                throw new Error('Leaflet is not loaded');
            }

            // Check if map container exists
            const mapContainer = document.getElementById('campus-map');
            if (!mapContainer) {
                throw new Error('Map container not found');
            }

            if (mapContainer._leaflet_id) {
                mapContainer._leaflet_id = undefined;
                mapContainer.innerHTML = '';
            }

            // University of Alabama campus center coordinates
            const campusCenter = this.campusData.getCampusCenter();
            
            // Initialize map centered on UA campus
            this.map = L.map('campus-map').setView([campusCenter.lat, campusCenter.lng], 16);
            
            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(this.map);
            
            // Add campus building markers
            this.addCampusBuildingMarkers();
            
            // Setup map click handlers
            this.setupMapClickHandlers();
            
            // Add map controls
            this.addMapControls();
            
            this.initialized = true;
            
        } catch (error) {
            this.showMapError(error.message);
        }
    }

    /**
     * Show map error message
     * @param {string} message - Error message
     */
    showMapError(message) {
        const mapContainer = document.getElementById('campus-map');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div class="d-flex align-items-center justify-content-center h-100 bg-light">
                    <div class="text-center">
                        <i class="bi bi-exclamation-triangle text-warning" style="font-size: 2rem;"></i>
                        <h6 class="mt-2 text-muted">Map Loading Error</h6>
                        <small class="text-muted">${message}</small>
                        <br>
                        <button class="btn btn-sm btn-outline-primary mt-2" onclick="location.reload()">
                            <i class="bi bi-arrow-clockwise me-1"></i>Retry
                        </button>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Add markers for all campus buildings
     */
    addCampusBuildingMarkers() {
        const locations = this.campusData.getLocations();
        
        Object.entries(locations).forEach(([name, coords]) => {
            const icon = this.getBuildingIcon(coords.type);
            
            const marker = L.marker([coords.lat, coords.lng], { icon: icon })
                .bindPopup(`
                    <div class="text-center">
                        <h6 class="mb-1 fw-bold">${name}</h6>
                        <small class="text-muted">${coords.type.charAt(0).toUpperCase() + coords.type.slice(1)}</small>
                        <br>
                        <button class="btn btn-sm btn-primary mt-2" onclick="window.mapIntegration.setPickupLocation('${name}')">
                            Set as Pickup
                        </button>
                        <button class="btn btn-sm btn-success mt-2 ms-1" onclick="window.mapIntegration.setDropoffLocation('${name}')">
                            Set as Dropoff
                        </button>
                    </div>
                `);
            
            marker.addTo(this.map);
            this.campusMarkers.push(marker);
        });
    }

    /**
     * Get icon for building type
     * @param {string} type - Building type
     * @returns {L.Icon} Leaflet icon
     */
    getBuildingIcon(type) {
        const iconColors = {
            'academic': '#2d5a27',
            'residential': '#4a7c59',
            'dining': '#f4d03f',
            'recreation': '#e74c3c',
            'parking': '#95a5a6',
            'hub': '#3498db',
            'landmark': '#9b59b6'
        };
        
        const color = iconColors[type] || '#2d5a27';
        
        return L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        });
    }

    /**
     * Setup map click handlers
     */
    setupMapClickHandlers() {
        this.map.on('click', (e) => {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            
            // Find nearest campus building
            const nearestBuilding = this.locationServices.getNearestCampusBuildingName(lat, lng);
            
            // Show location selection popup
            this.showLocationSelectionPopup(lat, lng, nearestBuilding);
        });
    }

    /**
     * Show location selection popup
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {string} nearestBuilding - Nearest building name
     */
    showLocationSelectionPopup(lat, lng, nearestBuilding) {
        const popup = L.popup()
            .setLatLng([lat, lng])
            .setContent(`
                <div class="text-center">
                    <h6 class="mb-2">Select Location</h6>
                    <p class="small mb-2">Nearest: ${nearestBuilding}</p>
                    <p class="small text-muted mb-3">${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                    <button class="btn btn-sm btn-primary" onclick="window.mapIntegration.setPickupFromCoords(${lat}, ${lng}, '${nearestBuilding}')">
                        Set as Pickup
                    </button>
                    <button class="btn btn-sm btn-success ms-1" onclick="window.mapIntegration.setDropoffFromCoords(${lat}, ${lng}, '${nearestBuilding}')">
                        Set as Dropoff
                    </button>
                </div>
            `)
            .openOn(this.map);
    }

    /**
     * Add map controls
     */
    addMapControls() {
        // Add scale control
        L.control.scale().addTo(this.map);
        
        // Add custom control for current location
        const currentLocationControl = L.control({ position: 'topright' });
        
        currentLocationControl.onAdd = function(map) {
            const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
            div.innerHTML = '<button class="btn btn-primary btn-sm" title="Use Current Location"><i class="bi bi-crosshair"></i></button>';
            div.style.backgroundColor = 'white';
            div.style.border = '2px solid rgba(0,0,0,0.2)';
            div.style.borderRadius = '4px';
            div.style.cursor = 'pointer';
            
            div.onclick = function() {
                window.mapIntegration.useCurrentLocation();
            };
            
            return div;
        };
        
        currentLocationControl.addTo(this.map);
    }

    /**
     * Set pickup location from building name
     * @param {string} buildingName - Building name
     */
    setPickupLocation(buildingName) {
        const coords = this.campusData.getLocationCoordinates(buildingName);
        if (coords) {
            this.setPickupFromCoords(coords.lat, coords.lng, buildingName);
        }
    }

    /**
     * Set dropoff location from building name
     * @param {string} buildingName - Building name
     */
    setDropoffLocation(buildingName) {
        const coords = this.campusData.getLocationCoordinates(buildingName);
        if (coords) {
            this.setDropoffFromCoords(coords.lat, coords.lng, buildingName);
        }
    }

    /**
     * Set pickup location from coordinates
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {string} locationName - Location name
     */
    setPickupFromCoords(lat, lng, locationName) {
        // Remove existing pickup marker
        if (this.pickupMarker) {
            this.map.removeLayer(this.pickupMarker);
        }
        
        // Create new pickup marker
        this.pickupMarker = L.marker([lat, lng], {
            draggable: true,
            icon: L.divIcon({
                className: 'custom-div-icon pickup-pin',
                html: `
                    <div class="pin-container pickup-container">
                        <div class="pin-shadow"></div>
                        <div class="pin-icon pickup-icon">
                            <i class="bi bi-geo-alt-fill"></i>
                        </div>
                        <div class="pin-label pickup-label">
                            <span class="pin-text">PICKUP</span>
                            <div class="pin-arrow"></div>
                        </div>
                        <div class="pin-pulse pickup-pulse"></div>
                        <div class="pin-glow pickup-glow"></div>
                    </div>
                `,
                iconSize: [50, 60],
                iconAnchor: [25, 55]
            })
        }).addTo(this.map);

        // Add drag event listener for pickup marker
        this.pickupMarker.on('dragend', (e) => {
            const newPos = e.target.getLatLng();
            const nearestBuilding = this.locationServices.getNearestCampusBuildingName(newPos.lat, newPos.lng);
            document.getElementById('pickup-location').value = nearestBuilding;
        });
        
        // Update form input
        document.getElementById('pickup-location').value = locationName;
        document.getElementById('pickup-location').classList.add('is-valid');
        
        // Close any open popups
        this.map.closePopup();
    }

    /**
     * Set dropoff location from coordinates
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {string} locationName - Location name
     */
    setDropoffFromCoords(lat, lng, locationName) {
        // Remove existing dropoff marker
        if (this.dropoffMarker) {
            this.map.removeLayer(this.dropoffMarker);
        }
        
        // Create new dropoff marker
        this.dropoffMarker = L.marker([lat, lng], {
            draggable: true,
            icon: L.divIcon({
                className: 'custom-div-icon dropoff-pin',
                html: `
                    <div class="pin-container dropoff-container">
                        <div class="pin-shadow"></div>
                        <div class="pin-icon dropoff-icon">
                            <i class="bi bi-flag-fill"></i>
                        </div>
                        <div class="pin-label dropoff-label">
                            <span class="pin-text">DROPOFF</span>
                            <div class="pin-arrow"></div>
                        </div>
                        <div class="pin-pulse dropoff-pulse"></div>
                        <div class="pin-glow dropoff-glow"></div>
                    </div>
                `,
                iconSize: [50, 60],
                iconAnchor: [25, 55]
            })
        }).addTo(this.map);

        // Add drag event listener for dropoff marker
        this.dropoffMarker.on('dragend', (e) => {
            const newPos = e.target.getLatLng();
            const nearestBuilding = this.locationServices.getNearestCampusBuildingName(newPos.lat, newPos.lng);
            document.getElementById('dropoff-location').value = nearestBuilding;
        });
        
        // Update form input
        document.getElementById('dropoff-location').value = locationName;
        document.getElementById('dropoff-location').classList.add('is-valid');
        
        // Close any open popups
        this.map.closePopup();
    }

    /**
     * Use current GPS location
     */
    async useCurrentLocation() {
        try {
            const locationData = await this.locationServices.getCurrentLocationWithBuilding();
            
            // Remove existing user location marker
            if (this.userLocationMarker) {
                this.map.removeLayer(this.userLocationMarker);
            }
            
            // Add user location marker
            this.userLocationMarker = L.marker([locationData.lat, locationData.lng], {
                icon: L.divIcon({
                    className: 'custom-div-icon user-location-pin',
                    html: `
                        <div class="pin-container">
                            <div class="pin-icon user-location-icon">
                                <i class="bi bi-person-fill"></i>
                            </div>
                            <div class="pin-label user-location-label">YOU</div>
                            <div class="pin-pulse user-location-pulse"></div>
                        </div>
                    `,
                    iconSize: [35, 45],
                    iconAnchor: [17, 40]
                })
            }).addTo(this.map);
            
            // Set pickup location to current location
            this.setPickupFromCoords(locationData.lat, locationData.lng, locationData.nearestBuilding);
            
            // Update current location display
            document.getElementById('current-location').textContent = locationData.nearestBuilding;
            
            // Show notification
            if (window.riderInterface) {
                window.riderInterface.showNotification(`Location set to ${locationData.nearestBuilding}`, 'success');
            }
            
        } catch (error) {
            console.error('Error getting current location:', error);
            if (window.riderInterface) {
                window.riderInterface.showNotification('Could not get current location. Please try again.', 'warning');
            }
        }
    }

    /**
     * Clear all markers
     */
    clearMarkers() {
        if (this.pickupMarker) {
            this.map.removeLayer(this.pickupMarker);
            this.pickupMarker = null;
        }
        
        if (this.dropoffMarker) {
            this.map.removeLayer(this.dropoffMarker);
            this.dropoffMarker = null;
        }
        
        if (this.userLocationMarker) {
            this.map.removeLayer(this.userLocationMarker);
            this.userLocationMarker = null;
        }
    }

    /**
     * Fit map to show all markers
     */
    fitToMarkers() {
        const group = new L.featureGroup();
        
        if (this.pickupMarker) group.addLayer(this.pickupMarker);
        if (this.dropoffMarker) group.addLayer(this.dropoffMarker);
        if (this.userLocationMarker) group.addLayer(this.userLocationMarker);
        
        if (group.getLayers().length > 0) {
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    /**
     * Get map instance
     * @returns {L.Map} Leaflet map instance
     */
    getMap() {
        return this.map;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapIntegration;
}
