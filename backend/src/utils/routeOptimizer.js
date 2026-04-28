const hubs = {
  'New York': { lat: 40.7128, lng: -74.0060 },
  'Cincinnati': { lat: 39.1031, lng: -84.5120 },
  'St. Louis': { lat: 38.6270, lng: -90.1994 },
  'Chicago': { lat: 41.8781, lng: -87.6298 },
  'Nashville': { lat: 36.1627, lng: -86.7816 },
  'Atlanta': { lat: 33.7490, lng: -84.3880 },
  'Miami': { lat: 25.7617, lng: -80.1918 },
  'Houston': { lat: 29.7604, lng: -95.3698 },
  'Dallas': { lat: 32.7767, lng: -96.7970 },
  'Denver': { lat: 39.7392, lng: -104.9903 },
  'Boise': { lat: 43.6150, lng: -116.2023 },
  'Seattle': { lat: 47.6062, lng: -122.3321 },
  'Los Angeles': { lat: 34.0522, lng: -118.2437 },
  'Phoenix': { lat: 33.4484, lng: -112.0740 }
};

// Connections with base cost/distance in arbitrary units (roughly km / 100)
const graph = {
  'New York': { 'Cincinnati': 10, 'Atlanta': 14, 'Chicago': 12 },
  'Cincinnati': { 'New York': 10, 'St. Louis': 5, 'Chicago': 4, 'Nashville': 4 },
  'St. Louis': { 'Cincinnati': 5, 'Chicago': 4, 'Dallas': 10, 'Denver': 13 },
  'Chicago': { 'New York': 12, 'Cincinnati': 4, 'St. Louis': 4, 'Denver': 16 },
  'Nashville': { 'Cincinnati': 4, 'Atlanta': 4, 'Dallas': 11 },
  'Atlanta': { 'New York': 14, 'Nashville': 4, 'Miami': 10, 'Houston': 12 },
  'Miami': { 'Atlanta': 10, 'Houston': 19 },
  'Houston': { 'Miami': 19, 'Atlanta': 12, 'Dallas': 4, 'Phoenix': 18 },
  'Dallas': { 'Houston': 4, 'Nashville': 11, 'St. Louis': 10, 'Denver': 12, 'Phoenix': 16 },
  'Denver': { 'Chicago': 16, 'St. Louis': 13, 'Dallas': 12, 'Boise': 12, 'Los Angeles': 16, 'Phoenix': 13 },
  'Boise': { 'Denver': 12, 'Seattle': 8, 'Los Angeles': 13 },
  'Seattle': { 'Boise': 8, 'Los Angeles': 18 },
  'Los Angeles': { 'Seattle': 18, 'Boise': 13, 'Denver': 16, 'Phoenix': 6 },
  'Phoenix': { 'Los Angeles': 6, 'Denver': 13, 'Dallas': 16, 'Houston': 18 }
};

// Dijkstra's Algorithm (Multi-Objective)
const findShortestPath = (start, end, blockedOrDelayedNodes = [], weights = { time: 1, cost: 1, co2: 1, risk: 1 }) => {
  const distances = {};
  const prev = {};
  let unvisited = Object.keys(graph);

  unvisited.forEach(node => {
    distances[node] = Infinity;
    prev[node] = null;
  });
  distances[start] = 0;

  while (unvisited.length > 0) {
    let current = null;
    let minDistance = Infinity;
    unvisited.forEach(node => {
      if (distances[node] < minDistance) {
        current = node;
        minDistance = distances[node];
      }
    });

    if (current === null || current === end) break;

    unvisited = unvisited.filter(node => node !== current);

    for (let neighbor in graph[current]) {
      // Base metrics for this edge
      const distance = graph[current][neighbor];
      const timeCost = distance * 1; 
      const monetaryCost = distance * 1.5;
      const co2Cost = distance * 0.15;
      
      // Dynamic penalty for disrupted nodes (risk)
      const riskPenalty = blockedOrDelayedNodes.includes(neighbor) ? 50 : 0; 
      
      // Weighted edge cost
      const weightedCost = 
        (timeCost * weights.time) + 
        (monetaryCost * weights.cost) + 
        (co2Cost * weights.co2) + 
        (riskPenalty * weights.risk);

      let newDist = distances[current] + weightedCost;
      
      if (newDist < distances[neighbor]) {
        distances[neighbor] = newDist;
        prev[neighbor] = current;
      }
    }
  }

  // Build path
  const path = [];
  let curr = end;
  while (curr !== null) {
    path.unshift(curr);
    curr = prev[curr];
  }
  
  if (path[0] !== start) return null; // No path found

  // Calculate actual non-weighted metrics for the return object
  let totalDistance = 0;
  for(let i=0; i<path.length-1; i++) {
    totalDistance += graph[path[i]][path[i+1]];
  }

  const co2Emissions = (totalDistance * 0.15).toFixed(2);
  const estimatedCost = (totalDistance * 1.5).toFixed(2);
  const coordinates = path.map(node => hubs[node]);

  return {
    pathNames: path,
    coordinates,
    totalDistance,
    co2Emissions,
    estimatedCost,
    score: distances[end] // The total weighted internal score
  };
};

module.exports = { hubs, findShortestPath };
