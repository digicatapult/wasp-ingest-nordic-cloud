# wasp-ingest-nordic-cloud

WASP Ingest for nRF Cloud

Connects to a [Nordic Cloud](https://nrfcloud.com/) supplied MQTT broker. Parses and reformats messages from Nordic devices, then forwards them to be used throughout the rest of WASP.

## Getting started

`wasp-ingest-nordic-cloud` can be run in a similar way to most nodejs applications. First install required dependencies using `npm`:

```sh
npm install
```

### Testing

For integration testing, `wasp-ingest-nordic-cloud` depends on Mosquitto, Kafka and Zookeeper. These can be brought locally up using docker:

```sh
docker-compose up -d
```

You can then run tests with:

```sh
npm test
```

## Environment Variables

`wasp-ingest-nordic-cloud` is configured primarily using environment variables. The service supports loading of environment variables from a .env file which is the recommended method for development.

### General Configuration

| variable            | required |       default        | description                                                                                                           |
| :------------------ | :------: | :------------------: | :-------------------------------------------------------------------------------------------------------------------- |
| PORT                |    N     |        `3000`        | Port on which the service will listen                                                                                 |
| LOG_LEVEL           |    N     |        `info`        | Logging level. Valid values are [`trace`, `debug`, `info`, `warn`, `error`, `fatal`]. When testing, default = `debug` |
| KAFKA_LOG_LEVEL     |    N     |      `nothing`       | Logging level for Kafka. Valid values are [`debug`, `info`, `warn`, `error`, `nothing`]                               |
| KAFKA_BROKERS       |    N     | `['localhost:9092']` | List of addresses for the Kafka brokers                                                                               |
| KAFKA_PAYLOAD_TOPIC |    N     |    `raw-payloads`    | Topic to publish payloads to                                                                                          |
| WASP_INGEST_NAME    |    N     |    `nordic-cloud`    | Name of this ingest type                                                                                              |

### `mqtt`

| variable                       | required |    default    | description                                                                                                        |
| :----------------------------- | :------: | :-----------: | :----------------------------------------------------------------------------------------------------------------- |
| MQTT_AUTH_METHOD               |    N     | `certificate` | Authorisation method for MQTT connection. Valid values are [`certificate`, `none`]. When testing, default = `none` |
| NORDIC_CLOUD_MQTT_ENDPOINT     |    Y     |       -       | Endpoint for Nordic Cloud MQTT broker. When testing, default = `mqtt://localhost:1883` (Mosquitto)                 |
| NORDIC_CLOUD_MQTT_CERT_CLIENT  |    Y     |       -       | Client certificate for TLS connection to Nordic Cloud MQTT broker                                                  |
| NORDIC_CLOUD_MQTT_KEY_CLIENT   |    Y     |       -       | Private client key for TLS connection to Nordic Cloud MQTT broker                                                  |
| NORDIC_CLOUD_MQTT_CERT_CA      |    Y     |       -       | Server certificate (CA) for TLS connection to Nordic Cloud MQTT broker                                             |
| NORDIC_CLOUD_MQTT_CLIENT_ID    |    Y     |       -       | Client identifier for the Nordic Cloud MQTT broker                                                                 |
| NORDIC_CLOUD_MQTT_TOPIC_PREFIX |    Y     |       -       | Prefix for all topics when subscribing to Nordic Cloud MQTT broker                                                 |
