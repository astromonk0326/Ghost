const assert = require('assert/strict');
const sinon = require('sinon');
const DomainEvents = require('@tryghost/domain-events');
const MemberRepository = require('../../../../lib/repositories/MemberRepository');
const {SubscriptionCreatedEvent} = require('@tryghost/member-events');

const mockOfferRedemption = {
    add: sinon.stub()
};

describe('MemberRepository', function () {
    afterEach(function () {
        sinon.restore();
    });

    describe('#isComplimentarySubscription', function () {
        it('Does not error when subscription.plan is null', function () {
            const repo = new MemberRepository({OfferRedemption: mockOfferRedemption});
            repo.isComplimentarySubscription({});
        });
    });

    describe('#resolveContextSource', function (){
        it('Maps context to source', function (){
            const repo = new MemberRepository({OfferRedemption: mockOfferRedemption});

            let source = repo._resolveContextSource({
                import: true
            });
            assert.equal(source, 'import');

            source = repo._resolveContextSource({
                importer: true
            });
            assert.equal(source, 'import');

            source = repo._resolveContextSource({
                user: true
            });
            assert.equal(source, 'admin');

            source = repo._resolveContextSource({
                user: true,
                api_key: true
            });
            assert.equal(source, 'api');

            source = repo._resolveContextSource({
                api_key: true
            });
            assert.equal(source, 'api');

            source = repo._resolveContextSource({
            });
            assert.equal(source, 'member');

            source = repo._resolveContextSource({
                generic_context: true
            });
            assert.equal(source, 'member');
        });
    });

    describe('setComplimentarySubscription', function () {
        let Member;
        let productRepository;

        beforeEach(function () {
            Member = {
                findOne: sinon.stub().resolves({
                    id: 'member_id_123',
                    related: () => {
                        return {
                            fetch: () => {
                                return {
                                    models: []
                                };
                            }
                        };
                    }
                })
            };
        });

        it('throws an error when there is no default product', async function () {
            productRepository = {
                getDefaultProduct: sinon.stub().resolves(null)
            };

            const repo = new MemberRepository({
                Member,
                stripeAPIService: {
                    configured: true
                },
                productRepository,
                OfferRedemption: mockOfferRedemption
            });

            try {
                await repo.setComplimentarySubscription({
                    id: 'member_id_123'
                }, {
                    transacting: true
                });

                assert.fail('setComplimentarySubscription should have thrown');
            } catch (err) {
                assert.equal(err.message, 'Could not find Product "default"');
            }
        });

        it('uses the right options for fetching default product', async function () {
            productRepository = {
                getDefaultProduct: sinon.stub().resolves({
                    toJSON: () => {
                        return null;
                    }
                })
            };

            const repo = new MemberRepository({
                Member,
                stripeAPIService: {
                    configured: true
                },
                productRepository,
                OfferRedemption: mockOfferRedemption
            });

            try {
                await repo.setComplimentarySubscription({
                    id: 'member_id_123'
                }, {
                    transacting: true,
                    withRelated: ['labels']
                });

                assert.fail('setComplimentarySubscription should have thrown');
            } catch (err) {
                productRepository.getDefaultProduct.calledWith({withRelated: ['stripePrices'], transacting: true}).should.be.true();
                assert.equal(err.message, 'Could not find Product "default"');
            }
        });
    });

    describe('linkSubscription', function (){
        let Member;
        let MemberPaidSubscriptionEvent;
        let StripeCustomerSubscription;
        let MemberProductEvent;
        let stripeAPIService;
        let productRepository;
        let offerRepository;
        let labsService;
        let subscriptionData;
        let notifySpy;

        afterEach(function () {
            sinon.restore();
        });

        beforeEach(async function () {
            notifySpy = sinon.spy();

            subscriptionData = {
                id: 'sub_123',
                customer: 'cus_123',
                status: 'active',
                items: {
                    type: 'list',
                    data: [{
                        id: 'item_123',
                        price: {
                            id: 'price_123',
                            product: 'product_123',
                            active: true,
                            nickname: 'Monthly',
                            currency: 'usd',
                            recurring: {
                                interval: 'month'
                            },
                            unit_amount: 500,
                            type: 'recurring'
                        }
                    }]
                },
                start_date: Date.now() / 1000,
                current_period_end: Date.now() / 1000 + (60 * 60 * 24 * 31),
                cancel_at_period_end: false
            };

            Member = {
                findOne: sinon.stub().resolves({
                    related: (relation) => {
                        return {
                            query: sinon.stub().returns({
                                fetchOne: sinon.stub().resolves({})
                            }),
                            toJSON: sinon.stub().returns(relation === 'products' ? [] : {}),
                            fetch: sinon.stub().resolves({
                                toJSON: sinon.stub().returns(relation === 'products' ? [] : {})
                            })
                        };
                    },
                    toJSON: sinon.stub().returns({})
                }),
                edit: sinon.stub().resolves({
                    attributes: {},
                    _previousAttributes: {}
                })
            };
            MemberPaidSubscriptionEvent = {
                add: sinon.stub().resolves()
            };
            StripeCustomerSubscription = {
                add: sinon.stub().resolves({
                    get: sinon.stub().returns()
                })
            };
            MemberProductEvent = {
                add: sinon.stub().resolves({})
            };

            stripeAPIService = {
                configured: true,
                getSubscription: sinon.stub().resolves(subscriptionData)
            };

            productRepository = {
                get: sinon.stub().resolves({
                    get: sinon.stub().returns(),
                    toJSON: sinon.stub().returns({})
                }),
                update: sinon.stub().resolves({})
            };

            labsService = {
                isSet: sinon.stub().returns(true)
            };

            offerRepository = {
                getById: sinon.stub().resolves({
                    id: 'offer_123'
                })
            };
        });

        it('dispatches paid subscription event', async function (){
            const repo = new MemberRepository({
                stripeAPIService,
                StripeCustomerSubscription,
                MemberPaidSubscriptionEvent,
                MemberProductEvent,
                productRepository,
                labsService,
                Member,
                OfferRedemption: mockOfferRedemption
            });

            sinon.stub(repo, 'getSubscriptionByStripeID').resolves(null);

            DomainEvents.subscribe(SubscriptionCreatedEvent, notifySpy);

            await repo.linkSubscription({
                subscription: subscriptionData
            }, {
                transacting: {
                    executionPromise: Promise.resolve()
                },
                context: {}
            });

            notifySpy.calledOnce.should.be.true();
        });

        it('attaches offer information to subscription event', async function (){
            const repo = new MemberRepository({
                stripeAPIService,
                StripeCustomerSubscription,
                MemberPaidSubscriptionEvent,
                MemberProductEvent,
                productRepository,
                offerRepository,
                labsService,
                Member,
                OfferRedemption: mockOfferRedemption
            });

            sinon.stub(repo, 'getSubscriptionByStripeID').resolves(null);

            DomainEvents.subscribe(SubscriptionCreatedEvent, notifySpy);

            await repo.linkSubscription({
                id: 'member_id_123',
                subscription: subscriptionData,
                offerId: 'offer_123'
            }, {
                transacting: {
                    executionPromise: Promise.resolve()
                },
                context: {}
            });

            notifySpy.calledOnce.should.be.true();
            notifySpy.calledWith(sinon.match((event) => {
                if (event.data.offerId === 'offer_123') {
                    return true;
                }
                return false;
            })).should.be.true();
        });
    });

    describe('create', function () {
        let memberStub, memberModelStub, newslettersServiceStub;

        beforeEach(function () {
            memberStub = {
                get: sinon.stub(),
                related: sinon.stub()
            };

            memberStub.related
                .withArgs('products').returns({
                    models: []
                })
                .withArgs('newsletters').returns({
                    models: []
                });

            memberModelStub = {
                add: sinon.stub().resolves(memberStub)
            };

            newslettersServiceStub = {
                browse: sinon.stub()
            };
        });

        it('subscribes a member to the specified newsletters', async function () {
            const newsletters = [{
                id: 'abc123',
                status: 'active'
            },
            {
                id: 'def456',
                status: 'active'
            },
            {
                id: 'ghi789',
                status: 'active'
            }];

            const newsletterIds = newsletters.map(newsletter => newsletter.id);
            newslettersServiceStub.browse
                .withArgs({
                    filter: `id:[${newsletterIds}]`,
                    columns: ['id', 'status']
                })
                .resolves(newsletters);

            const repo = new MemberRepository({
                Member: memberModelStub,
                MemberStatusEvent: {
                    add: sinon.stub().resolves()
                },
                MemberSubscribeEvent: {
                    add: sinon.stub().resolves()
                },
                newslettersService: newslettersServiceStub
            });

            await repo.create({
                email: 'jamie@example.com',
                email_disabled: false,
                newsletters: [
                    {id: newsletters[0].id},
                    {id: newsletters[1].id},
                    {id: newsletters[2].id}
                ]
            });

            newslettersServiceStub.browse.calledOnce.should.be.true();
            memberModelStub.add.calledOnce.should.be.true();
            memberModelStub.add.args[0][0].newsletters.should.eql([
                {id: newsletters[0].id},
                {id: newsletters[1].id},
                {id: newsletters[2].id}
            ]);
        });

        it('does not allow a member to be subscribed to an invalid newsletter', async function () {
            const INVALID_NEWSLETTER_ID = 'abc123';

            newslettersServiceStub.browse
                .withArgs({
                    filter: `id:[${INVALID_NEWSLETTER_ID}]`,
                    columns: ['id', 'status']
                })
                .resolves([]);

            const repo = new MemberRepository({
                Member: memberModelStub,
                MemberStatusEvent: {
                    add: sinon.stub().resolves()
                },
                MemberSubscribeEvent: {
                    add: sinon.stub().resolves()
                },
                newslettersService: newslettersServiceStub
            });

            await repo.create({
                email: 'jamie@example.com',
                email_disabled: false,
                newsletters: [
                    {id: INVALID_NEWSLETTER_ID}
                ]
            }).should.be.rejectedWith(`Cannot subscribe to invalid newsletter ${INVALID_NEWSLETTER_ID}`);
        });

        it('does not subscribe a member to an archived newsletter', async function () {
            const newsletter = {
                id: 'abc123',
                status: 'archived'
            };

            newslettersServiceStub.browse
                .withArgs({
                    filter: `id:[${newsletter.id}]`,
                    columns: ['id', 'status']
                })
                .resolves([newsletter]);

            const repo = new MemberRepository({
                Member: memberModelStub,
                MemberStatusEvent: {
                    add: sinon.stub().resolves()
                },
                MemberSubscribeEvent: {
                    add: sinon.stub().resolves()
                },
                newslettersService: newslettersServiceStub
            });

            await repo.create({
                email: 'jamie@example.com',
                email_disabled: false,
                newsletters: [
                    {id: newsletter.id}
                ]
            });

            newslettersServiceStub.browse.calledOnce.should.be.true();
            memberModelStub.add.calledOnce.should.be.true();
            memberModelStub.add.args[0][0].newsletters.should.eql([]);
        });
    });
});
