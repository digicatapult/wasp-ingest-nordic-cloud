const envalid = require('envalid')
const dotenv = require('dotenv')

if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: 'test/test.env' })
}
const options = { strict: true }

const MQTT_AUTH_ENVS = {
  none: {},
  certificate: {
    NORDIC_CLOUD_MQTT_KEY_CLIENT: envalid.str(),
    NORDIC_CLOUD_MQTT_CERT_CLIENT: envalid.str(),
    NORDIC_CLOUD_MQTT_CERT_CA: envalid.str(),
    NORDIC_CLOUD_MQTT_CLIENT_ID: envalid.str(),
  },
}

const { MQTT_AUTH_METHOD } = envalid.cleanEnv(process.env, {
  MQTT_AUTH_METHOD: envalid.str({ default: 'certificate', devDefault: 'none', choices: ['certificate', 'none'] }),
})

const vars = envalid.cleanEnv(
  process.env,
  {
    ...MQTT_AUTH_ENVS[MQTT_AUTH_METHOD],
    PORT: envalid.port({ default: 3000 }),
    LOG_LEVEL: envalid.str({
      default: 'info',
      devDefault: 'debug',
      choices: ['trace', 'debug', 'info', 'warn', 'error', 'fatal'],
    }),
    KAFKA_LOG_LEVEL: envalid.str({
      default: 'nothing',
      choices: ['debug', 'info', 'warn', 'error', 'nothing'],
    }),
    NORDIC_CLOUD_MQTT_ENDPOINT: envalid.url({
      devDefault: 'mqtt://localhost:1883',
    }),
    KAFKA_BROKERS: envalid.makeValidator((input) => {
      const kafkaSet = new Set(input === '' ? [] : input.split(','))
      if (kafkaSet.size === 0) throw new Error('At least one kafka broker must be configured')
      return [...kafkaSet]
    })({ default: 'localhost:9092' }),
    KAFKA_PAYLOAD_TOPIC: envalid.str({ default: 'raw-payloads' }),
    NORDIC_CLOUD_MQTT_TOPIC_PREFIX: envalid.str({ devDefault: '' }),
    WASP_INGEST_NAME: envalid.str({ default: 'nordic-cloud' }),
  },
  options
)

module.exports = {
  ...vars,
  MQTT_AUTH_METHOD,
}
