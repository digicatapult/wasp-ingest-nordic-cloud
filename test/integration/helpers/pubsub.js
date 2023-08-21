const { Kafka, logLevel: kafkaLogLevels } = require('kafkajs')
require('dotenv').config()
const mqtt = require('mqtt')
const { setTimeout } = require('node:timers/promises')

const env = require('../../../app/env')

const createPubSub = async () => {
  const mqttClient = mqtt.connect(env.NORDIC_CLOUD_MQTT_ENDPOINT)
  const kafka = new Kafka({
    clientId: 'ingest-nordic-cloud-testing',
    brokers: env.KAFKA_BROKERS,
    logLevel: kafkaLogLevels.ERROR,
  })

  const consumer = kafka.consumer({ groupId: 'test' })
  await consumer.connect()
  await consumer.subscribe({ topic: env.KAFKA_PAYLOAD_TOPIC, fromBeginning: true })

  const messages = []
  await consumer.run({
    eachMessage: async ({ topic, partition, message: { key, value } }) => {
      messages.push({
        topic,
        partition,
        key: key.toString('utf8'),
        message: JSON.parse(value.toString('utf8')),
      })
    },
  })
  const publishAndWait = async ({ message, expectedMessages = 1, waitForExcessMessagesMS = 50 }) => {
    messages.splice(0, messages.length)
    const prefix = env.NORDIC_CLOUD_MQTT_TOPIC_PREFIX
    mqttClient.publish(`${prefix}/nrf-111111111111111/d2c`, message)
    while (messages.length < expectedMessages) {
      await setTimeout(10)
    }
    await setTimeout(waitForExcessMessagesMS)
    return [...messages]
  }

  return new Promise((resolve) => {
    while (!mqttClient.connected) {
      setTimeout(50)
    }

    resolve({
      publishAndWait,
      disconnect: async () => {
        await consumer.stop()
        await consumer.disconnect()
      },
    })
  })
}

module.exports = createPubSub
