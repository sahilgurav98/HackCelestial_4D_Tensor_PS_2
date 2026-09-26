
# TravelGuard Realtime Data Provider

The active provider is `src/server.js`. It exposes one normalized API for flights, trains, and buses.

## Runtime flow

1. `GET /api/transports/:id/live` returns the latest state for a selected leg.
2. The provider advances a deterministic simulated clock every five minutes by default.
3. Snapshots are stored in memory with delay, reliability, congestion, and weather-risk features for later ML training.
4. The main backend polls only the legs in a saved itinerary and updates its Neo4j dependency graph.

## Demo endpoints

- `GET /health`
- `GET /api/transports?origin=DEL&destination=JP`
- `GET /api/transports/FL001/live`
- `POST /api/simulator/FL001/delay` with `{ "delayMinutes": 100 }`
- `POST /api/simulator/tick`
- `POST /api/simulator/reset`
