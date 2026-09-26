const dataProvider = require("../services/dataProvider.service");

async function getTransports(req, res, next) {
  try {
    const [flights, trains] =
      await Promise.all([
        dataProvider.getFlights(),
        dataProvider.getTrains()
      ]);

    res.json({
      success: true,
      data: [
        ...flights,
        ...trains
      ]
    });
  } catch (error) {
    error.code =
      error.code || "DATA_PROVIDER_UNAVAILABLE";

    next(error);
  }
}

async function getTransport(req, res, next) {
  try {
    const { id } = req.params;

    let transport;

    try {
      transport =
        await dataProvider.getFlight(id);
    } catch {
      transport =
        await dataProvider.getTrain(id);
    }

    res.json({
      success: true,
      data: transport
    });
  } catch (error) {
    error.code =
      error.code || "TRANSPORT_NOT_FOUND";

    next(error);
  }
}

async function searchTransports(req, res, next) {
  try {
    const {
      origin,
      destination,
      type
    } = req.query;

    const [flights, trains] =
      await Promise.all([
        dataProvider.getFlights(),
        dataProvider.getTrains()
      ]);

    let transports = [
      ...flights,
      ...trains
    ];

    if (origin) {
      transports = transports.filter(
        (transport) =>
          transport.origin?.code === origin ||
          transport.origin?.city === origin ||
          transport.origin?.name === origin
      );
    }

    if (destination) {
      transports = transports.filter(
        (transport) =>
          transport.destination?.code ===
            destination ||
          transport.destination?.city ===
            destination ||
          transport.destination?.name ===
            destination
      );
    }

    if (type) {
      transports = transports.filter(
        (transport) =>
          transport.type === type.toUpperCase()
      );
    }

    res.json({
      success: true,
      data: transports
    });
  } catch (error) {
    error.code =
      error.code || "DATA_PROVIDER_UNAVAILABLE";

    next(error);
  }
}

module.exports = {
  getTransports,
  getTransport,
  searchTransports
};