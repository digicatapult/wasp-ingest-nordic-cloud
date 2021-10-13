const { describe, before, it } = require('mocha')
const { expect } = require('chai')

const { setupServer } = require('./helpers/server')
const createPubSub = require('./helpers/pubsub')

const defaultMessage = {
  appId: 'TEMP',
  data: '20.9',
  messageType: 'DATA',
}

describe('Message Processing', function () {
  let pubsub = null
  before(async function () {
    // Kafka consumer can take a while to come up as it needs to wait t be leader
    this.timeout(30000)
    pubsub = await createPubSub()
  })

  after(async function () {
    this.timeout(30000)
    await pubsub.disconnect()
  })

  describe('happy path', function () {
    const context = {}
    before(async function () {
      this.timeout(30000)
      await setupServer(context)
      context.messages = await pubsub.publishAndWait({
        message: JSON.stringify(defaultMessage),
      })
    })

    it('should send the correct messages', function () {
      expect(context.messages.length).to.equal(1)
      const message = context.messages[0]
      expect(message.topic).to.equal('raw-payloads')
      expect(message.key).to.equal('nrf-111111111111111')
      expect(message.message.ingest).to.equal('nordic-cloud')
      expect(message.message.ingestId).to.equal('nrf-111111111111111')
      expect(message.message.metadata.deviceId).to.equal('nrf-111111111111111')
      expect(message.message.payload).to.deep.equal(defaultMessage)
      const now = new Date().getTime()
      expect(new Date(message.message.timestamp).getTime()).to.be.within(now - 1000, now)
    })
  })

  const badMessageTest = ({ testName, message }) => {
    describe(testName, function () {
      const context = {}
      before(async function () {
        this.timeout(30000)
        await setupServer(context)
        context.messages = await pubsub.publishAndWait({
          message,
          expectedMessages: 0,
        })
      })

      it('should not see any messages on bad input', function () {
        expect(context.messages.length).to.equal(0)
      })
    })
  }

  badMessageTest({
    testName: 'invalid message should not be published (not json)',
    message: 'not json } ',
  })

  badMessageTest({
    testName: 'invalid message should not be published (missing appId)',
    message: JSON.stringify({ ...defaultMessage, appId: undefined }),
  })

  badMessageTest({
    testName: 'invalid message should not be published (missing data)',
    message: JSON.stringify({ ...defaultMessage, data: undefined }),
  })

  badMessageTest({
    testName: 'invalid message should not be published (missing messageType)',
    message: JSON.stringify({ ...defaultMessage, messageType: undefined }),
  })
})
