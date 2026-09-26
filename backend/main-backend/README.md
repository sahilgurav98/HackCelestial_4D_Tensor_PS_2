# TravelGuard AI - Main Backend

Main orchestration backend for TravelGuard AI.

## Architecture

React Frontend
        |
        v
Main Backend :5000
        |
        +---- Data Provider :5001
        |
        +---- Neo4j Engine :8000
        |
        +---- FastAPI ML :8001
        |
        +---- MongoDB :27017

## Setup

Install dependencies:

npm install

Create environment:

cp .env.example .env

Start development server:

npm run dev

Production:

npm start

Tests:

npm test

## Environment

PORT=5000

DATA_PROVIDER_URL=http://localhost:5001

NEO4J_ENGINE_URL=http://localhost:8000

NEO4J_REGISTER_PATH=/journeys

ML_SERVICE_URL=http://localhost:8001

MONGODB_URI=mongodb://localhost:27017/travelguard

FRONTEND_URL=http://localhost:5173

## APIs

### Health

GET /health

### Transport

GET /api/transports

GET /api/transports/:id

GET /api/transports/search

### Itinerary

POST /api/itineraries

GET /api/itineraries/:tripId

GET /api/itineraries/:tripId/dependencies

GET /api/itineraries/:tripId/status

POST /api/itineraries/:tripId/check-disruption

POST /api/itineraries/:tripId/simulate-delay

GET /api/itineraries/:tripId/affected

GET /api/itineraries/:tripId/recovery

POST /api/itineraries/:tripId/recovery/select

The standalone demo can be bootstrapped with the canonical `TG001` itinerary
using `FL001` and `TR001` even before the Data Provider is available. Provider
responses remain preferred when the provider is running.

## Demo flow

```powershell
curl.exe -X POST http://localhost:5000/api/itineraries -H "Content-Type: application/json" -d '{"tripId":"TG001","legs":[{"transportId":"FL001","type":"FLIGHT"},{"transportId":"TR001","type":"TRAIN"}]}'
curl.exe http://localhost:5000/api/itineraries/TG001/dependencies
curl.exe -X POST http://localhost:5000/api/itineraries/TG001/simulate-delay -H "Content-Type: application/json" -d '{"transportId":"FL001","delayMinutes":100}'
curl.exe -X POST http://localhost:5000/api/itineraries/TG001/check-disruption
curl.exe http://localhost:5000/api/itineraries/TG001/affected
curl.exe http://localhost:5000/api/itineraries/TG001/recovery
curl.exe -X POST http://localhost:5000/api/itineraries/TG001/recovery/select -H "Content-Type: application/json" -d '{"transportId":"TR002"}'
```

### ML

POST /api/predictions/delay

## Example itinerary

POST /api/itineraries

{
  "tripId": "TG001",
  "legs": [
    {
      "transportId": "FL001",
      "type": "FLIGHT"
    },
    {
      "transportId": "TR001",
      "type": "TRAIN"
    }
  ]
}

## Responsibilities

Main Backend:
- API gateway
- service orchestration
- itinerary management
- MongoDB persistence

Data Provider:
- flight/train data
- historical data
- simulation

Neo4j Engine:
- graph relationships
- dependencies
- affected connections
- recovery

FastAPI:
- ML prediction

React:
- user interface
