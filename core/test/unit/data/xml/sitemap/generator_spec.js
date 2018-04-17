'use strict';

const should = require('should'),
    sinon = require('sinon'),
    Promise = require('bluebird'),
    validator = require('validator'),
    _ = require('lodash'),
    testUtils = require('../../../../utils'),
    api = require('../../../../../server/api'),
    urlService = require('../../../../../server/services/url'),
    IndexGenerator = require('../../../../../server/data/xml/sitemap/index-generator'),
    PostGenerator = require('../../../../../server/data/xml/sitemap/post-generator'),
    PageGenerator = require('../../../../../server/data/xml/sitemap/page-generator'),
    TagGenerator = require('../../../../../server/data/xml/sitemap/tag-generator'),
    UserGenerator = require('../../../../../server/data/xml/sitemap/user-generator'),
    sandbox = sinon.sandbox.create();

should.Assertion.add('ValidUrlNode', function (options) {
    // Check urlNode looks correct
    /*eslint no-invalid-this: "off"*/
    let urlNode = this.obj;
    let flatNode;

    urlNode.should.be.an.Object().with.key('url');
    urlNode.url.should.be.an.Array();

    if (options.withImage) {
        urlNode.url.should.have.lengthOf(5);
    } else {
        urlNode.url.should.have.lengthOf(4);
    }

    /**
     * A urlNode looks something like:
     * { url:
     *   [ { loc: 'http://127.0.0.1:2369/author/' },
     *     { lastmod: '2014-12-22T11:54:00.100Z' },
     *     { changefreq: 'weekly' },
     *     { priority: 0.6 },
     *     { 'image:image': [
     *       { 'image:loc': 'post-100.jpg' },
     *       { 'image:caption': 'post-100.jpg' }
     *     ] }
     *  ] }
     */
    flatNode = _.extend.apply(_, urlNode.url);

    if (options.withImage) {
        flatNode.should.be.an.Object().with.keys('loc', 'lastmod', 'changefreq', 'priority', 'image:image');
    } else {
        flatNode.should.be.an.Object().with.keys('loc', 'lastmod', 'changefreq', 'priority');
    }
});

describe('Generators', function () {
    let generator;

    afterEach(function () {
        sandbox.restore();
    });

    describe('IndexGenerator', function () {
        beforeEach(function () {
            generator = new IndexGenerator({
                types: {
                    posts: new PostGenerator(),
                    pages: new PageGenerator(),
                    tags: new TagGenerator(),
                    authors: new UserGenerator()
                }
            });
        });

        describe('fn: getXml', function () {
            it('default', function () {
                const xml = generator.getXml();

                xml.should.match(/sitemap-tags.xml/);
                xml.should.match(/sitemap-posts.xml/);
                xml.should.match(/sitemap-pages.xml/);
                xml.should.match(/sitemap-authors.xml/);
            });
        });
    });

    describe('PostGenerator', function () {
        beforeEach(function () {
            generator = new PostGenerator();
        });

        describe('fn: getPriorityForDatum', function () {
            it('uses 0.9 priority for featured posts', function () {
                generator.getPriorityForDatum({
                    featured: true
                }).should.equal(0.9);
            });

            it('uses 0.8 priority for all other (non-featured) posts', function () {
                generator.getPriorityForDatum({
                    featured: false
                }).should.equal(0.8);
            });
        });

        describe('fn: createNodeFromDatum', function () {
            it('adds an image:image element if post has a cover image', function () {
                const urlNode = generator.createUrlNodeFromDatum('https://myblog.com/test/', testUtils.DataGenerator.forKnex.createPost({
                    feature_image: 'post-100.jpg',
                    page: false,
                    slug: 'test'
                }));

                urlNode.should.be.a.ValidUrlNode({withImage: true});
            });
        });

        describe('fn: getXml', function () {
            beforeEach(function () {
                sandbox.stub(urlService.utils, 'urlFor');
            });

            it('get cached xml', function () {
                sandbox.spy(generator, 'generateXmlFromNodes');
                generator.siteMapContent = 'something';
                generator.getXml().should.eql('something');
                generator.siteMapContent = null;
                generator.generateXmlFromNodes.called.should.eql(false);
            });

            it('compare content output', function () {
                let idxFirst, idxSecond, idxThird;

                urlService.utils.urlFor.withArgs('image', {image: 'post-100.jpg'}, true).returns('http://my-ghost-blog.com/images/post-100.jpg');
                urlService.utils.urlFor.withArgs('image', {image: 'post-200.jpg'}, true).returns('http://my-ghost-blog.com/images/post-200.jpg');
                urlService.utils.urlFor.withArgs('image', {image: 'post-300.jpg'}, true).returns('http://my-ghost-blog.com/images/post-300.jpg');
                urlService.utils.urlFor.withArgs('sitemap_xsl', true).returns('http://my-ghost-blog.com/sitemap.xsl');

                generator.addUrl('http://my-ghost-blog.com/url/100/', testUtils.DataGenerator.forKnex.createPost({
                    feature_image: 'post-100.jpg',
                    created_at: (Date.UTC(2014, 11, 22, 12) - 360000) + 100,
                    updated_at: null,
                    published_at: null,
                    slug: '100'
                }));

                generator.addUrl('http://my-ghost-blog.com/url/200/', testUtils.DataGenerator.forKnex.createPost({
                    created_at: (Date.UTC(2014, 11, 22, 12) - 360000) + 200,
                    updated_at: null,
                    published_at: null,
                    slug: '200'
                }));

                generator.addUrl('http://my-ghost-blog.com/url/300/', testUtils.DataGenerator.forKnex.createPost({
                    created_at: (Date.UTC(2014, 11, 22, 12) - 360000) + 300,
                    feature_image: 'post-300.jpg',
                    updated_at: null,
                    published_at: null,
                    slug: '300'
                }));

                const xml = generator.getXml();

                xml.should.containEql('<loc>http://my-ghost-blog.com/url/100/</loc>');
                xml.should.containEql('<loc>http://my-ghost-blog.com/url/200/</loc>');
                xml.should.containEql('<loc>http://my-ghost-blog.com/url/300/</loc>');

                xml.should.containEql('<image:loc>http://my-ghost-blog.com/images/post-100.jpg</image:loc>');
                // This should NOT be present
                xml.should.not.containEql('<image:loc>http://my-ghost-blog.com/images/post-200.jpg</image:loc>');
                xml.should.containEql('<image:loc>http://my-ghost-blog.com/images/post-300.jpg</image:loc>');

                // Validate order newest to oldest
                idxFirst = xml.indexOf('<loc>http://my-ghost-blog.com/url/300/</loc>');
                idxSecond = xml.indexOf('<loc>http://my-ghost-blog.com/url/200/</loc>');
                idxThird = xml.indexOf('<loc>http://my-ghost-blog.com/url/100/</loc>');

                idxFirst.should.be.below(idxSecond);
                idxSecond.should.be.below(idxThird);
            });
        });

        describe('fn: removeUrl', function () {
            let post;

            beforeEach(function () {
                post = testUtils.DataGenerator.forKnex.createPost();
                generator.nodeLookup[post.id] = 'node';
            });

            afterEach(function () {
                generator.nodeLookup = {};
                generator.nodeTimeLookup = {};
            });

            it('remove none existend url', function () {
                generator.removeUrl('https://myblog.com/blog/podcast/featured/', testUtils.DataGenerator.forKnex.createPost());
                Object.keys(generator.nodeLookup).length.should.eql(1);
            });

            it('remove existing url', function () {
                generator.removeUrl('https://myblog.com/blog/test/', post);
                Object.keys(generator.nodeLookup).length.should.eql(0);
            });
        });
    });

    describe('PageGenerator', function () {
        beforeEach(function () {
            generator = new PageGenerator();
        });

        describe('fn: getXml', function () {
            it('has a home item even if pages are empty', function () {
                generator.getXml();
                generator.siteMapContent.should.containEql('<loc>' + urlService.utils.urlFor('home', true) + '</loc>');
                // <loc> should exist exactly one time
                generator.siteMapContent.indexOf('<loc>').should.eql(generator.siteMapContent.lastIndexOf('<loc>'));
            });

            it('has a home item when pages are not empty', function () {
                generator.addUrl('magic', testUtils.DataGenerator.forKnex.createPost({
                    page: true,
                    slug: 'static-page'
                }));

                generator.getXml();
                generator.siteMapContent.should.containEql('<loc>' + urlService.utils.urlFor('home', true) + '</loc>');
                generator.siteMapContent.should.containEql('<loc>' + urlService.utils.urlFor('page', {url: 'magic'}, true) + '</loc>');
            });
        });

        describe('fn: getPriorityForDatum', function () {
            it('uses 1 priority for home page', function () {
                generator.getPriorityForDatum({
                    name: 'home'
                }).should.equal(1);
            });
            it('uses 0.8 priority for static pages', function () {
                generator.getPriorityForDatum({}).should.equal(0.8);
            });
        });
    });

    describe('TagGenerator', function () {
        beforeEach(function () {
            generator = new TagGenerator();
        });

        describe('fn: getPriorityForDatum', function () {
            it('uses 0.6 priority for all tags', function () {
                generator.getPriorityForDatum({}).should.equal(0.6);
            });
        });
    });

    describe('UserGenerator', function () {
        beforeEach(function () {
            generator = new UserGenerator();
        });

        describe('fn: getPriorityForDatum', function () {
            it('uses 0.6 priority for author links', function () {
                generator.getPriorityForDatum({}).should.equal(0.6);
            });
        });

        describe('fn: validateImageUrl', function () {
            it('image url is localhost', function () {
                generator.validateImageUrl('http://localhost:2368/content/images/1.jpg').should.be.true();
            });

            it('image url is https', function () {
                generator.validateImageUrl('https://myblog.com/content/images/1.png').should.be.true();
            });

            it('image url is external', function () {
                generator.validateImageUrl('https://myblog.com/1.jpg').should.be.true();
            });

            it('no host', function () {
                generator.validateImageUrl('/content/images/1.jpg').should.be.false();
            });
        });
    });
});
