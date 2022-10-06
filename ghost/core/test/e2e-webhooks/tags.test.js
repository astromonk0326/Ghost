const {agentProvider, mockManager, fixtureManager, matchers} = require('../utils/e2e-framework');
const {anyGhostAgent, anyObjectId, anyISODateTime, anyUuid, anyString, anyContentVersion, anyNumber, anyLocalURL} = matchers;

const tagSnapshot = {
    created_at: anyISODateTime,
    description: anyString,
    id: anyObjectId,
    updated_at: anyISODateTime,
    url: anyLocalURL,
    visibility: 'public'
};

describe('tag.* events', function () {
    let adminAPIAgent;
    let webhookMockReceiver;

    before(async function () {
        adminAPIAgent = await agentProvider.getAdminAPIAgent();
        await fixtureManager.init('integrations');
        await adminAPIAgent.loginAsOwner();
    });

    beforeEach(function () {
        webhookMockReceiver = mockManager.mockWebhookRequests();
    });

    afterEach(function () {
        mockManager.restore();
    });

    it('tag.added event is triggered', async function () {
        const webhookURL = 'https://test-webhook-receiver.com/tag-added/';
        await webhookMockReceiver.mock(webhookURL);
        await fixtureManager.insertWebhook({
            event: 'tag.added',
            url: webhookURL
        });

        await adminAPIAgent
            .post('tags/')
            .body({
                tags: [{
                    name: 'Test Tag',
                    slug: 'test-tag',
                    description: 'Test Description'
                }]
            })
            .expectStatus(201);

        await webhookMockReceiver.receivedRequest();

        webhookMockReceiver
            .matchHeaderSnapshot({
                'content-version': anyContentVersion,
                'content-length': anyNumber,
                'user-agent': anyGhostAgent
            })
            .matchBodySnapshot({
                tag: {
                    current: tagSnapshot
                }
            });
    });
});