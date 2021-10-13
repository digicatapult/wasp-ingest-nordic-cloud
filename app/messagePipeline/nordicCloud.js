const mqtt = require('mqtt')

const globalLogger = require('../logger')
const {
  NORDIC_CLOUD_MQTT_ENDPOINT,
  MQTT_AUTH_METHOD,
  NORDIC_CLOUD_MQTT_CERT_CA,
  NORDIC_CLOUD_MQTT_CERT_CLIENT,
  NORDIC_CLOUD_MQTT_CLIENT_ID,
  NORDIC_CLOUD_MQTT_KEY_CLIENT,
  NORDIC_CLOUD_MQTT_TOPIC_PREFIX,
} = require('../env')

const setupNordicCloudListener = async (next) => {
  const logger = globalLogger.child({ module: 'nordic-cloud' })

  let hasResolved = false

  return new Promise((resolve, reject) => {
    const credentials =
      MQTT_AUTH_METHOD === 'certificate'
        ? {
            key: NORDIC_CLOUD_MQTT_KEY_CLIENT,
            cert: NORDIC_CLOUD_MQTT_CERT_CLIENT,
            ca: NORDIC_CLOUD_MQTT_CERT_CA,
            clientId: NORDIC_CLOUD_MQTT_CLIENT_ID,
          }
        : ''

    const client = mqtt.connect(NORDIC_CLOUD_MQTT_ENDPOINT, credentials)
    client.on('connect', function () {
      logger.info('Connection to MQTT server established')

      const topic = `${NORDIC_CLOUD_MQTT_TOPIC_PREFIX}/#`
      client.subscribe(topic, (err) => {
        if (err) {
          logger.error(`Error subscribing to Nordic Cloud MQTT (${topic})`)
          if (!hasResolved) {
            hasResolved = true
            reject(new Error(`Error subscribing to Nordic Cloud MQTT (${topic})`))
          }
        } else {
          logger.debug(`Successfully subscribed to Nordic Cloud MQTT (${topic})`)
          if (!hasResolved) {
            hasResolved = true
            resolve()
          }
        }
      })
    })
    client.on('close', function () {
      logger.info('Disconnected from MQTT server')
    })
    client.on('reconnect', function () {
      logger.info('Reconnecting to MQTT server')
    })
    client.on('error', function (err) {
      logger.warn(`Error from MQTT client. Error was ${err}`)
      if (!hasResolved) {
        hasResolved = true
        reject(new Error(`Error from MQTT client. Error was ${err}`))
      }
    })
    client.on('message', async (topic, rawPayload) => {
      let payload = null
      try {
        payload = JSON.parse(Buffer.from(rawPayload).toString('utf8'))
        if (!payload || !payload.appId || !payload.data || !payload.messageType) {
          throw new Error('Nordic Cloud payload is invalid, does not contain one of [appId, data, messageType]')
        }
      } catch (err) {
        logger.warn(`Error parsing payload error was ${err.message || err}`)
        return
      }

      logger.trace(`Payload: ${JSON.stringify(payload)}`)

      next(topic, payload)
    })
  })
}

module.exports = setupNordicCloudListener
