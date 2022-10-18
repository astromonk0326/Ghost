const {agentProvider, fixtureManager, matchers} = require('../../utils/e2e-framework');
const {anyObjectId, anyString, anyEtag, anyNumber} = matchers;

const matchLink = {
    post_id: anyObjectId,
    link: {
        link_id: anyObjectId,
        from: anyString,
        to: anyString
    },
    count: {
        clicks: anyNumber
    }
};

describe('Links API', function () {
    let agent;
    beforeEach(async function () {
        agent = await agentProvider.getAdminAPIAgent();
        await fixtureManager.init('posts', 'links');
        await agent.loginAsOwner();
    });

    it('Can browse all links', async function () {
        await agent
            .get('links')
            .expectStatus(200)
            .matchHeaderSnapshot({
                etag: anyEtag
            })
            .matchBodySnapshot({
                links: new Array(3).fill(matchLink)
            });
    });

    it('Can bulk update multiple links with same site redirect', async function () {
        const req = await agent.get('links');
        const siteLink = req.body.links.find((link) => {
            return link.link.to.includes('/email/');
        });
        const postId = siteLink.post_id;
        const originalTo = siteLink.link.to;
        const filter = `post_id:${postId}+to:'${originalTo}'`;
        await agent
            .put(`links/bulk/?filter=${encodeURIComponent(filter)}`)
            .body({
                bulk: {
                    action: 'updateLink',
                    meta: {
                        link: {
                            to: 'http://127.0.0.1:2369/blog/emails/test?example=1'
                        }
                    }
                }
            })
            .expectStatus(200)
            .matchBodySnapshot({
                bulk: {
                    action: 'updateLink',
                    meta: {
                        stats: {
                            successful: 2,
                            unsuccessful: 0
                        },
                        errors: [],
                        unsuccessfulData: []
                    }
                }
            })
            .matchHeaderSnapshot({
                etag: anyEtag
            });
        await agent
            .get('links')
            .expectStatus(200)
            .matchHeaderSnapshot({
                etag: anyEtag
            })
            .matchBodySnapshot({
                links: [
                    matchLink,
                    {
                        ...matchLink,
                        link: {
                            ...matchLink.link,
                            to: 'http://127.0.0.1:2369/blog/emails/test?example=1&ref=Test-newsletter&attribution_type=post&attribution_id=618ba1ffbe2896088840a6df'
                        }
                    },
                    {
                        ...matchLink,
                        link: {
                            ...matchLink.link,
                            to: 'http://127.0.0.1:2369/blog/emails/test?example=1&ref=Test-newsletter&attribution_type=post&attribution_id=618ba1ffbe2896088840a6df'
                        }
                    }
                ]
            });
    });

    it('Can bulk update links with external redirect', async function () {
        const req = await agent.get('links');
        const siteLink = req.body.links.find((link) => {
            return link.link.to.includes('subscripe');
        });
        const postId = siteLink.post_id;
        const originalTo = siteLink.link.to;
        const filter = `post_id:${postId}+to:'${originalTo}'`;
        await agent
            .put(`links/bulk/?filter=${encodeURIComponent(filter)}`)
            .body({
                bulk: {
                    action: 'updateLink',
                    meta: {
                        link: {
                            to: 'https://example.com/subscribe?ref=Test-newsletter'
                        }
                    }
                }
            })
            .expectStatus(200)
            .matchBodySnapshot({
                bulk: {
                    action: 'updateLink',
                    meta: {
                        stats: {
                            successful: 1,
                            unsuccessful: 0
                        },
                        errors: [],
                        unsuccessfulData: []
                    }
                }
            })
            .matchHeaderSnapshot({
                etag: anyEtag
            });
        await agent
            .get('links')
            .expectStatus(200)
            .matchHeaderSnapshot({
                etag: anyEtag
            })
            .matchBodySnapshot({
                links: [
                    {
                        ...matchLink,
                        link: {
                            ...matchLink.link,
                            to: 'https://example.com/subscribe?ref=Test-newsletter'
                        }
                    },
                    matchLink,
                    matchLink
                ]
            });
    });

    it('Can call bulk update link with 0 matches', async function () {
        const req = await agent.get('links');
        const siteLink = req.body.links.find((link) => {
            return link.link.to.includes('subscripe');
        });
        const postId = siteLink.post_id;
        const originalTo = 'https://empty.example.com';
        const filter = `post_id:${postId}+to:'${originalTo}'`;
        await agent
            .put(`links/bulk/?filter=${encodeURIComponent(filter)}`)
            .body({
                bulk: {
                    action: 'updateLink',
                    meta: {
                        link: {
                            to: 'https://example.com/subscribe?ref=Test-newsletter'
                        }
                    }
                }
            })
            .expectStatus(200)
            .matchBodySnapshot({
                bulk: {
                    action: 'updateLink',
                    meta: {
                        stats: {
                            successful: 0,
                            unsuccessful: 0
                        },
                        errors: [],
                        unsuccessfulData: []
                    }
                }
            })
            .matchHeaderSnapshot({
                etag: anyEtag
            });
        await agent
            .get('links')
            .expectStatus(200)
            .matchHeaderSnapshot({
                etag: anyEtag
            })
            .matchBodySnapshot({
                links: [
                    {
                        ...matchLink,
                        link: {
                            ...matchLink.link,
                            to: 'https://example.com/subscripe?ref=Test-newsletter'
                        }
                    },
                    matchLink,
                    matchLink
                ]
            });
    });
});
