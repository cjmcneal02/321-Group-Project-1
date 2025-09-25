/**
 * Map Integration Module for Solar Chauffeur
 * Handles interactive Leaflet map with draggable markers
 */

class MapIntegration {
    constructor(campusData, locationServices) {
        console.log('MapIntegration constructor called');
        
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
        
        // Always update global reference to the latest instance
        window.mapIntegration = this;
        
        // Don't auto-initialize - let rider-interface.js control when to initialize
        // this.waitForLeaflet();
    }

    /**
     * Wait for Leaflet to be available
     */
    waitForLeaflet() {
        console.log('waitForLeaflet called');
        const checkLeaflet = () => {
            this.retryCount++;
            console.log('Checking Leaflet availability, attempt:', this.retryCount, 'Leaflet available:', typeof L !== 'undefined');
            
            if (typeof L !== 'undefined') {
                console.log('Leaflet found, initializing map');
                this.initMap();
            } else if (this.retryCount < this.maxRetries) {
                console.log('Leaflet not ready, retrying in 100ms');
                setTimeout(checkLeaflet, 100);
            } else {
                console.error('Leaflet failed to load after', this.maxRetries, 'attempts');
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
            console.log('initMap called - initialized:', this.initialized, 'map exists:', !!this.map);
            if (this.initialized || this.map) {
                console.log('Map already initialized, returning');
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
            
            // Check if there's already a map in the container
            if (mapContainer._leaflet_id) {
                console.log('Map container already has a Leaflet instance, skipping initialization');
                return;
            }

            // Ensure container has proper dimensions
            if (mapContainer.offsetWidth === 0 || mapContainer.offsetHeight === 0) {
                mapContainer.style.width = '100%';
                mapContainer.style.height = '400px';
            }

            if (mapContainer._leaflet_id) {
                // Properly remove existing map instance
                if (this.map) {
                    this.map.remove();
                    this.map = null;
                }
                mapContainer._leaflet_id = undefined;
                mapContainer.innerHTML = '';
            }


            // University of Alabama campus center coordinates
            const campusCenter = this.campusData.getCampusCenter();
            
            // Initialize map with proper interaction settings
            this.map = L.map('campus-map', {
                center: [campusCenter.lat, campusCenter.lng], 
                zoom: 16,
                dragging: true,        // Enable map dragging
                touchZoom: true,       // Enable touch zoom
                doubleClickZoom: true, // Enable double-click zoom
                scrollWheelZoom: true, // Enable scroll wheel zoom
                boxZoom: true,         // Enable box zoom
                keyboard: true,        // Enable keyboard navigation
                zoomControl: true      // Show zoom controls
            });
            
            
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
            console.log('Map initialization completed successfully');
            
        } catch (error) {
            console.error('Map initialization failed:', error);
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
        // Prevent marker placement after a drag - Leaflet fires a click after moveend
        let suppressNextClick = false;
        this.map.on('movestart', () => {
            suppressNextClick = true;
            this.map.getContainer().style.cursor = 'grabbing';
        });
        this.map.on('moveend', () => {
            setTimeout(() => {
                suppressNextClick = false;
            }, 150);
            this.map.getContainer().style.cursor = 'grab';
        });
        
        // Single-click to show location selection popup
        this.map.on('click', (e) => {
            if (suppressNextClick) {
                return;
            }
            
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            
            // Find nearest campus building
            const nearestBuilding = this.locationServices.getNearestCampusBuildingName(lat, lng);
            
            // Show location selection popup
            this.showLocationSelectionPopup(lat, lng, nearestBuilding);
        });
        
        // Prevent context menu on right click
        this.map.getContainer().addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // Setup touch handlers for mobile
        this.setupTouchHandlers();
    }
    
    /**
     * Setup touch event handlers for mobile devices
     */
    setupTouchHandlers() {
        let touchStartTime = 0;
        let touchMoved = false;
        
        this.map.on('touchstart', () => {
            touchStartTime = Date.now();
            touchMoved = false;
        });
        
        this.map.on('touchmove', () => {
            touchMoved = true;
        });
        
        this.map.on('touchend', (e) => {
            const touchDuration = Date.now() - touchStartTime;
            
            // Only treat as click if quick tap without movement
            if (touchDuration < 300 && !touchMoved) {
                // Handle as click
                const lat = e.latlng.lat;
                const lng = e.latlng.lng;
                const nearestBuilding = this.locationServices.getNearestCampusBuildingName(lat, lng);
                this.showLocationSelectionPopup(lat, lng, nearestBuilding);
            }
        });
    }

    /**
     * Show location selection popup
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {string} nearestBuilding - Nearest building name
     */
    showLocationSelectionPopup(lat, lng, nearestBuilding) {
        // Close any existing popups first
        this.map.closePopup();
        
        // Add small delay to ensure drag has finished
        setTimeout(() => {
            const popup = L.popup({
                closeOnClick: true,
                autoClose: true,
                closeButton: true
            })
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
        }, 100);
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
        if (!this.map || !this.initialized) {
            console.log('Map not ready, cannot set pickup location');
            return;
        }
        
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
        if (!this.map || !this.initialized) {
            console.log('Map not ready, cannot set dropoff location');
            return;
        }
        
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
        // Use global mapIntegration if this instance isn't ready
        const mapInstance = (this.map && this.initialized) ? this : window.mapIntegration;
        
        if (!mapInstance || !mapInstance.map || !mapInstance.initialized) {
            console.log('No initialized map instance available for pickup marker');
            return;
        }
        
        // Reset retry count on success
        this.pickupRetryCount = 0;
        
        // Remove existing pickup marker
        if (mapInstance.pickupMarker) {
            mapInstance.map.removeLayer(mapInstance.pickupMarker);
        }
        
        // Create new pickup marker
        mapInstance.pickupMarker = L.marker([lat, lng], {
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
        }).addTo(mapInstance.map);

        // Add drag event listener for pickup marker
        mapInstance.pickupMarker.on('dragend', (e) => {
            const newPos = e.target.getLatLng();
            const nearestBuilding = mapInstance.locationServices.getNearestCampusBuildingName(newPos.lat, newPos.lng);
            document.getElementById('pickup-location').value = nearestBuilding;
        });
        
        // Update form input
        document.getElementById('pickup-location').value = locationName;
        document.getElementById('pickup-location').classList.add('is-valid');
        
        // Close any open popups
        mapInstance.map.closePopup();
    }

    /**
     * Set dropoff location from coordinates
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {string} locationName - Location name
     */
    setDropoffFromCoords(lat, lng, locationName) {
        // Use global mapIntegration if this instance isn't ready
        const mapInstance = (this.map && this.initialized) ? this : window.mapIntegration;
        
        if (!mapInstance || !mapInstance.map || !mapInstance.initialized) {
            console.log('No initialized map instance available for dropoff marker');
            return;
        }
        
        // Reset retry count on success
        this.dropoffRetryCount = 0;
        
        // Remove existing dropoff marker
        if (mapInstance.dropoffMarker) {
            mapInstance.map.removeLayer(mapInstance.dropoffMarker);
        }
        
        // Create new dropoff marker
        mapInstance.dropoffMarker = L.marker([lat, lng], {
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
        }).addTo(mapInstance.map);

        // Add drag event listener for dropoff marker
        mapInstance.dropoffMarker.on('dragend', (e) => {
            const newPos = e.target.getLatLng();
            const nearestBuilding = mapInstance.locationServices.getNearestCampusBuildingName(newPos.lat, newPos.lng);
            document.getElementById('dropoff-location').value = nearestBuilding;
        });
        
        // Update form input
        document.getElementById('dropoff-location').value = locationName;
        document.getElementById('dropoff-location').classList.add('is-valid');
        
        // Close any open popups
        mapInstance.map.closePopup();
    }

    /**
     * Use current GPS location
     */
    async useCurrentLocation() {
        if (!this.map || !this.initialized) {
            console.log('Map not ready, cannot get current location');
            return;
        }
        
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
// Export for browser environment
if (typeof window !== 'undefined') {
    window.MapIntegration = MapIntegration;
}
