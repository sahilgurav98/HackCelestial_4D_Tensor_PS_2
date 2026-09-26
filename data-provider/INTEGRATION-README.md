# TravelGuard Combined Data Provider (Train + Flight)

This folder combines the existing Train Data Provider and partner Flight Data Provider into one Express server. Synthetic/demo datasets are not live transport feeds.

## Run from this folder

```powershell
npm.cmd install
npm.cmd test
npm.cmd start
```

Server default: `http://localhost:5001`

## APIs
- `GET /health`
- `GET /api/trains` and `/api/trains/:trainId`
- `GET /api/trains/search?origin=NDLS&destination=JP`
- `GET /api/trains/history`
- `GET /api/flights` and `/api/flights/:flightId`
- `GET /api/flights/search?origin=BOM&destination=DEL`
- `GET /api/flights/history`
- `POST /api/simulator/trains/:trainId/delay` with `{ "delayMinutes": 120 }`
- `POST /api/simulator/flights/:flightId/delay` with `{ "delayMinutes": 120 }`
- `POST /api/simulator/reset` resets both simulators

## Notes
- Shared health response identifies the service as `travelguard-data-provider`.
- Train module remains under `travelguard-data-provider/src`. Flight modules are copied into the same source tree using their original `controllers`, `data`, `routes`, `services`, and `simulator` directories.
- `node_modules`, `.git`, and the original `.env` were not included. Keep credentials in your local `.env`; do not commit it.
