# TravelGuard AI — Train Data Provider

Train API module built with Node.js and Express. Historical records are synthetic demo data, not official railway data.

## Run
```bash
npm install
npm run dev
```
The shared service runs on port 5001 (set `PORT` in `.env`).

## Endpoints
- `GET /health`
- `GET /api/trains`
- `GET /api/trains/:trainId`
- `GET /api/trains/search?origin=NDLS&destination=JP`
- `GET /api/trains/:trainId/status`
- `GET /api/trains/:trainId/history`
- `GET /api/trains/history`
- `POST /api/simulator/trains/:trainId/delay` with `{ "delayMinutes": 120 }`
- `POST /api/simulator/reset`

## Tests
```bash
npm test
```

## Integration note
`src/app.js` mounts the train routes. When the Flight module is ready, mount its router in the same app (for example, `app.use("/api/flights", flightRoutes)`). Do not start a second server on port 5001.
