# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a university campus ride-sharing web application built with vanilla JavaScript, Bootstrap 5.3.3, and Leaflet maps. The application connects riders with drivers for transportation around the University of Alabama campus.

## Tech Stack Constraints (Strictly Enforced)
- **Allowed**: HTML5, CSS3, Vanilla JavaScript (ES modules), Bootstrap 5.3.3 CDN, Bootstrap Icons CDN, Leaflet maps
- **Strictly Disallowed**: Node/NPM, React/Vue/Angular, jQuery, Tailwind, bundlers, transpilers, component libraries besides Bootstrap

## Development Commands
Since this is a static web application, no build commands are needed:
- **Local Development**: `python -m http.server 8000` or any static file server
- **Testing**: Open HTML files directly in browser, use browser dev tools
- **No build step required** - direct file modification and browser refresh

## Architecture Overview

### Core Application Structure
The application uses a modular vanilla JavaScript architecture with separate classes for different responsibilities:

- **CampusData** (`scripts/campus-data.js`): Contains University of Alabama campus locations, GPS coordinates, and graph data for pathfinding
- **ShortestPathAlgorithm** (`scripts/shortest-path.js`): Implements Dijkstra's algorithm for optimal route finding
- **LocationServices** (`scripts/location-services.js`): Handles geolocation, location validation, and campus mapping
- **MapIntegration** (`scripts/map-integration.js`): Leaflet map integration with campus overlay and route visualization  
- **RiderInterface** (`scripts/rider-interface.js`): Main UI controller for rider functionality, coordinates all other modules

### Data Flow and Dependencies
The application follows a dependency injection pattern where:
1. `CampusData` provides the foundational campus map and location data
2. `ShortestPathAlgorithm` and `LocationServices` depend on `CampusData`
3. `MapIntegration` integrates with location services for visual representation
4. `RiderInterface` orchestrates all modules and manages UI state

### File Structure
```
/
├── index.html              # Landing page with role selection
├── rider.html              # Rider interface (most complex page)
├── scripts/
│   ├── campus-data.js      # Campus locations and graph data (~16KB)
│   ├── shortest-path.js    # Dijkstra pathfinding algorithm (~12KB)
│   ├── location-services.js # GPS and location utilities (~13KB)  
│   ├── map-integration.js  # Leaflet map functionality (~15KB)
│   └── rider-interface.js  # Main UI controller (~39KB)
└── styles/
    ├── index.css           # Landing page styles
    └── rider.css           # Rider interface styles (~10KB)
```

## Campus Data Structure
The application models the University of Alabama campus as a weighted graph:
- **Nodes**: Real campus locations with GPS coordinates (lat/lng)
- **Edges**: Campus pathways with walking distances and restrictions
- **Location Types**: academic, residential, dining, recreation, parking, landmark
- **Popular Routes**: Pre-defined common campus routes for quick selection

## Key Implementation Details
- **State Management**: Uses localStorage for data persistence and custom events for component communication
- **Real-time Simulation**: Uses setInterval() for simulated real-time updates (no WebSocket server)
- **Mobile-First**: Bootstrap responsive design with touch-friendly interfaces
- **Error Handling**: Graceful fallbacks for GPS failures and offline scenarios
- **Accessibility**: Proper ARIA labels and semantic HTML structure

## Development Guidelines
1. **Bootstrap First**: Always use Bootstrap utilities before custom CSS
2. **Modular JS**: Each script file should be a self-contained class/module
3. **Real Coordinates**: Campus locations use actual University of Alabama GPS coordinates
4. **No External APIs**: All functionality works offline with mock data
5. **File Naming**: Use kebab-case for files (`shortest-path.js`, `location-services.js`)

## Critical Design Patterns
- Classes are instantiated in dependency order: CampusData → LocationServices/ShortestPath → MapIntegration → RiderInterface
- Error handling includes detailed console logging for debugging class instantiation
- UI components use Bootstrap modals, cards, and form validation
- Location input includes autocomplete with campus location suggestions

## Current Pages
- `index.html`: Landing page with rider/driver/admin role selection
- `rider.html`: Full rider interface with map, location selection, and ride request functionality
- Missing pages: `driver.html`, `admin.html` (referenced in navigation but not yet created)