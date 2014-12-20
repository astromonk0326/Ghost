/*globals describe, before, after, afterEach, beforeEach, it*/
/*jshint expr:true*/
var should         = require('should'),
    sinon          = require('sinon'),
    Promise        = require('bluebird'),
    hbs            = require('express-hbs'),
    utils          = require('./utils'),
    moment         = require('moment'),

// Stuff we are testing
    handlebars     = hbs.handlebars,
    helpers        = require('../../../server/helpers'),
    api            = require('../../../server/api');

describe('{{ghost_head}} helper', function () {
    var sandbox;

    before(function () {
        utils.loadHelpers();
        utils.overrideConfig({
            url: 'http://testurl.com/',
            theme: {
                title: 'Ghost',
                description: 'blog description',
                cover: '/content/images/blog-cover.png'
            }
        });
    });

    after(function () {
        utils.restoreConfig();
    });

    describe('without Code Injection', function () {
        beforeEach(function () {
            sandbox = sinon.sandbox.create();
            sandbox.stub(api.settings, 'read', function () {
                return Promise.resolve({
                    settings: [
                        {value: ''}
                    ]
                });
            });
        });

        afterEach(function () {
            sandbox.restore();
        });

        it('has loaded ghost_head helper', function () {
            should.exist(handlebars.helpers.ghost_head);
        });

        it('returns meta tag string on paginated index page', function (done) {
            helpers.ghost_head.call({version: '0.3.0', relativeUrl: '/page/2/', context: ['paged', 'index']}).then(function (rendered) {
                should.exist(rendered);
                rendered.string.should.match(/<link rel="canonical" href="http:\/\/testurl.com\/page\/2\/" \/>/);
                rendered.string.should.match(/<meta name="generator" content="Ghost 0.3" \/>/);
                rendered.string.should.match(/<link rel="alternate" type="application\/rss\+xml" title="Ghost" href="http:\/\/testurl.com\/rss\/" \/>/);
                rendered.string.should.not.match(/<meta property="og/);
                rendered.string.should.not.match(/<script type=\"application\/ld\+json\">/);

                done();
            }).catch(done);
        });

        it('returns structured data on first index page', function (done) {
            helpers.ghost_head.call({version: '0.3.0', relativeUrl: '/', context: ['home', 'index']}).then(function (rendered) {
                should.exist(rendered);

                rendered.string.should.match(/<link rel="canonical" href="http:\/\/testurl.com\/" \/>/);
                rendered.string.should.match(/<meta property="og:site_name" content="Ghost" \/>/);
                rendered.string.should.match(/<meta property="og:type" content="website" \/>/);
                rendered.string.should.match(/<meta property="og:title" content="Ghost" \/>/);
                rendered.string.should.match(/<meta property="og:description" content="blog description..." \/>/);
                rendered.string.should.match(/<meta property="og:url" content="http:\/\/testurl.com\/" \/>/);
                rendered.string.should.match(/<meta property="og:image" content="http:\/\/testurl.com\/content\/images\/blog-cover.png" \/>/);
                rendered.string.should.match(/<meta name="twitter:card" content="summary_large_image" \/>/);
                rendered.string.should.match(/<meta name="twitter:title" content="Ghost" \/>/);
                rendered.string.should.match(/<meta name="twitter:description" content="blog description..." \/>/);
                rendered.string.should.match(/<meta name="twitter:url" content="http:\/\/testurl.com\/" \/>/);
                rendered.string.should.match(/<meta name="twitter:image:src" content="http:\/\/testurl.com\/content\/images\/blog-cover.png" \/>/);
                rendered.string.should.match(/<meta name="generator" content="Ghost 0.3" \/>/);
                rendered.string.should.match(/<link rel="alternate" type="application\/rss\+xml" title="Ghost" href="http:\/\/testurl.com\/rss\/" \/>/);
                rendered.string.should.not.match(/<script type=\"application\/ld\+json\">/);

                done();
            }).catch(done);
        });

        it('returns structured data on first tag page without schema', function (done) {
            var tag = {
                meta_description: 'tag meta description',
                title: 'tagtitle',
                meta_title: 'tag meta title',
                image: '/content/images/tag-image.png'
            };

            helpers.ghost_head.call({version: '0.3.0', relativeUrl: '/tag/tagtitle/', tag: tag, context: ['tag']}).then(function (rendered) {
                should.exist(rendered);
                rendered.string.should.match(/<link rel="canonical" href="http:\/\/testurl.com\/tag\/tagtitle\/" \/>/);
                rendered.string.should.match(/<meta property="og:site_name" content="Ghost" \/>/);
                rendered.string.should.match(/<meta property="og:type" content="website" \/>/);
                rendered.string.should.match(/<meta property="og:title" content="tag meta title" \/>/);
                rendered.string.should.match(/<meta property="og:description" content="tag meta description..." \/>/);
                rendered.string.should.match(/<meta property="og:url" content="http:\/\/testurl.com\/tag\/tagtitle\/" \/>/);
                rendered.string.should.match(/<meta property="og:image" content="http:\/\/testurl.com\/content\/images\/tag-image.png" \/>/);
                rendered.string.should.match(/<meta name="twitter:card" content="summary_large_image" \/>/);
                rendered.string.should.match(/<meta name="twitter:title" content="tag meta title" \/>/);
                rendered.string.should.match(/<meta name="twitter:description" content="tag meta description..." \/>/);
                rendered.string.should.match(/<meta name="twitter:url" content="http:\/\/testurl.com\/tag\/tagtitle\/" \/>/);
                rendered.string.should.match(/<meta name="twitter:image:src" content="http:\/\/testurl.com\/content\/images\/tag-image.png" \/>/);
                rendered.string.should.match(/<meta name="generator" content="Ghost 0.3" \/>/);
                rendered.string.should.match(/<link rel="alternate" type="application\/rss\+xml" title="Ghost" href="http:\/\/testurl.com\/rss\/" \/>/);
                rendered.string.should.not.match(/<script type=\"application\/ld\+json\">/);

                done();
            }).catch(done);
        });

        it('does not contain description meta tags if blank', function (done) {
            var tag = {
                meta_description: '',
                title: 'tagtitle',
                meta_title: 'tag meta title',
                image: '/content/images/tag-image.png'
            };

            helpers.ghost_head.call({version: '0.3.0', relativeUrl: '/tag/tagtitle/', tag: tag, context: ['tag']}).then(function (rendered) {
                should.exist(rendered);
                rendered.string.should.match(/<link rel="canonical" href="http:\/\/testurl.com\/tag\/tagtitle\/" \/>/);
                rendered.string.should.match(/<meta property="og:site_name" content="Ghost" \/>/);
                rendered.string.should.match(/<meta property="og:type" content="website" \/>/);
                rendered.string.should.match(/<meta property="og:title" content="tag meta title" \/>/);
                rendered.string.should.not.match(/<meta property="og:description" content="tag meta description..." \/>/);
                rendered.string.should.match(/<meta property="og:url" content="http:\/\/testurl.com\/tag\/tagtitle\/" \/>/);
                rendered.string.should.match(/<meta property="og:image" content="http:\/\/testurl.com\/content\/images\/tag-image.png" \/>/);
                rendered.string.should.match(/<meta name="twitter:card" content="summary_large_image" \/>/);
                rendered.string.should.match(/<meta name="twitter:title" content="tag meta title" \/>/);
                rendered.string.should.not.match(/<meta name="twitter:description" content="tag meta description..." \/>/);
                rendered.string.should.match(/<meta name="twitter:url" content="http:\/\/testurl.com\/tag\/tagtitle\/" \/>/);
                rendered.string.should.match(/<meta name="twitter:image:src" content="http:\/\/testurl.com\/content\/images\/tag-image.png" \/>/);
                rendered.string.should.match(/<meta name="generator" content="Ghost 0.3" \/>/);
                rendered.string.should.match(/<link rel="alternate" type="application\/rss\+xml" title="Ghost" href="http:\/\/testurl.com\/rss\/" \/>/);
                rendered.string.should.not.match(/<script type=\"application\/ld\+json\">/);

                done();
            }).catch(done);
        });

        it('does not return structured data on paginated tag pages', function (done) {
            var tag = {
                meta_description: 'tag meta description',
                title: 'tagtitle',
                meta_title: 'tag meta title',
                image: '/content/images/tag-image.png'
            };

            helpers.ghost_head.call({version: '0.3.0', relativeUrl: '/tag/tagtitle/page/2/', tag: tag, context: ['paged', 'tag']}).then(function (rendered) {
                should.exist(rendered);
                rendered.string.should.match(/<link rel="canonical" href="http:\/\/testurl.com\/tag\/tagtitle\/page\/2\/" \/>/);
                rendered.string.should.match(/<meta name="generator" content="Ghost 0.3" \/>/);
                rendered.string.should.match(/<link rel="alternate" type="application\/rss\+xml" title="Ghost" href="http:\/\/testurl.com\/rss\/" \/>/);
                rendered.string.should.not.match(/<meta property="og/);
                rendered.string.should.not.match(/<script type=\"application\/ld\+json\">/);

                done();
            }).catch(done);
        });

        it('returns structured data on first author page with cover image, without schema', function (done) {
            var author = {
                name: 'Author name',
                url: 'http//:testauthorurl.com',
                slug: 'AuthorName',
                bio: 'Author bio',
                image: '/content/images/test-author-image.png',
                cover: '/content/images/author-cover-image.png',
                website: 'http://authorwebsite.com'
            };

            helpers.ghost_head.call({version: '0.3.0', relativeUrl: '/author/AuthorName/', author: author, context: ['author']}).then(function (rendered) {
                should.exist(rendered);
                rendered.string.should.match(/<link rel="canonical" href="http:\/\/testurl.com\/author\/AuthorName\/" \/>/);
                rendered.string.should.match(/<meta property="og:site_name" content="Ghost" \/>/);
                rendered.string.should.match(/<meta property="og:type" content="profile" \/>/);
                rendered.string.should.match(/<meta property="og:description" content="Author bio..." \/>/);
                rendered.string.should.match(/<meta property="og:url" content="http:\/\/testurl.com\/author\/AuthorName\/" \/>/);
                rendered.string.should.match(/<meta property="og:image" content="http:\/\/testurl.com\/content\/images\/author-cover-image.png" \/>/);
                rendered.string.should.match(/<meta name="twitter:card" content="summary_large_image" \/>/);
                rendered.string.should.match(/<meta name="twitter:title" content="Author name - Ghost" \/>/);
                rendered.string.should.match(/<meta name="twitter:description" content="Author bio..." \/>/);
                rendered.string.should.match(/<meta name="twitter:url" content="http:\/\/testurl.com\/author\/AuthorName\/" \/>/);
                rendered.string.should.match(/<meta name="twitter:image:src" content="http:\/\/testurl.com\/content\/images\/author-cover-image.png" \/>/);
                rendered.string.should.match(/<meta name="generator" content="Ghost 0.3" \/>/);
                rendered.string.should.match(/<link rel="alternate" type="application\/rss\+xml" title="Ghost" href="http:\/\/testurl.com\/rss\/" \/>/);
                rendered.string.should.not.match(/<script type=\"application\/ld\+json\">/);

                done();
            }).catch(done);
        });

        it('does not return structured data on paginated author pages', function (done) {
            var author = {
                name: 'Author name',
                url: 'http//:testauthorurl.com',
                slug: 'AuthorName',
                bio: 'Author bio',
                image: '/content/images/test-author-image.png',
                cover: '/content/images/author-cover-image.png',
                website: 'http://authorwebsite.com'
            };

            helpers.ghost_head.call({version: '0.3.0', relativeUrl: '/author/AuthorName/page/2/', author: author, context: ['paged', 'author']}).then(function (rendered) {
                should.exist(rendered);
                rendered.string.should.match(/<link rel="canonical" href="http:\/\/testurl.com\/author\/AuthorName\/page\/2\/" \/>/);
                rendered.string.should.match(/<meta name="generator" content="Ghost 0.3" \/>/);
                rendered.string.should.match(/<link rel="alternate" type="application\/rss\+xml" title="Ghost" href="http:\/\/testurl.com\/rss\/" \/>/);
                rendered.string.should.not.match(/<meta property="og/);
                rendered.string.should.not.match(/<script type=\"application\/ld\+json\">/);

                done();
            }).catch(done);
        });

        it('returns meta tag string even if version is invalid', function (done) {
            helpers.ghost_head.call({version: '0.9', relativeUrl: '/page/2/', context: ['paged', 'index']}).then(function (rendered) {
                should.exist(rendered);
                rendered.string.should.match(/<link rel="canonical" href="http:\/\/testurl.com\/page\/2\/" \/>/);
                rendered.string.should.match(/<meta name="generator" content="Ghost 0.9" \/>/);
                rendered.string.should.match(/<link rel="alternate" type="application\/rss\+xml" title="Ghost" href="http:\/\/testurl.com\/rss\/" \/>/);
                rendered.string.should.not.match(/<meta property="og/);
                rendered.string.should.not.match(/<script type=\"application\/ld\+json\">/);

                done();
            }).catch(done);
        });

        it('returns structured data on post page with author image and post cover image', function (done) {
            var post = {
                meta_description: 'blog description',
                title: 'Welcome to Ghost',
                image: '/content/images/test-image.png',
                published_at:  moment('2008-05-31T19:18:15').toISOString(),
                updated_at: moment('2014-10-06T15:23:54').toISOString(),
                tags: [{name: 'tag1'}, {name: 'tag2'}, {name: 'tag3'}],
                author: {
                    name: 'Author name',
                    url: 'http//:testauthorurl.com',
                    slug: 'Author',
                    image: '/content/images/test-author-image.png',
                    website: 'http://authorwebsite.com'
                }
            };

            helpers.ghost_head.call({relativeUrl: '/post/', version: '0.3.0', context: ['post'], post: post}).then(function (rendered) {
                var re1 = new RegExp('<meta property="article:published_time" content="' + post.published_at),
                    re2 = new RegExp('<meta property="article:modified_time" content="' + post.updated_at),
                    re3 = new RegExp('"datePublished": "' + post.published_at),
                    re4 = new RegExp('"dateModified": "' + post.updated_at);

                should.exist(rendered);

                rendered.string.should.match(/<link rel="canonical" href="http:\/\/testurl.com\/post\/" \/>/);
                rendered.string.should.match(/<meta property="og:site_name" content="Ghost" \/>/);
                rendered.string.should.match(/<meta property="og:type" content="article" \/>/);
                rendered.string.should.match(/<meta property="og:title" content="Welcome to Ghost" \/>/);
                rendered.string.should.match(/<meta property="og:description" content="blog description..." \/>/);
                rendered.string.should.match(/<meta property="og:url" content="http:\/\/testurl.com\/post\/" \/>/);
                rendered.string.should.match(/<meta property="og:image" content="http:\/\/testurl.com\/content\/images\/test-image.png" \/>/);
                rendered.string.should.match(re1);
                rendered.string.should.match(re2);
                rendered.string.should.match(/<meta property="article:tag" content="tag1" \/>/);
                rendered.string.should.match(/<meta property="article:tag" content="tag2" \/>/);
                rendered.string.should.match(/<meta property="article:tag" content="tag3" \/>/);
                rendered.string.should.match(/<meta name="twitter:card" content="summary_large_image" \/>/);
                rendered.string.should.match(/<meta name="twitter:title" content="Welcome to Ghost" \/>/);
                rendered.string.should.match(/<meta name="twitter:description" content="blog description..." \/>/);
                rendered.string.should.match(/<meta name="twitter:url" content="http:\/\/testurl.com\/post\/" \/>/);
                rendered.string.should.match(/<meta name="twitter:image:src" content="http:\/\/testurl.com\/content\/images\/test-image.png" \/>/);
                rendered.string.should.match(/<script type=\"application\/ld\+json\">/);
                rendered.string.should.match(/"@context": "http:\/\/schema.org"/);
                rendered.string.should.match(/"@type": "Article"/);
                rendered.string.should.match(/"publisher": "Ghost"/);
                rendered.string.should.match(/"author": {/);
                rendered.string.should.match(/"@type": "Person"/);
                rendered.string.should.match(/"name": "Author name"/);
                rendered.string.should.match(/"image\": \"http:\/\/testurl.com\/content\/images\/test-author-image.png\"/);
                rendered.string.should.match(/"url": "http:\/\/testurl.com\/author\/Author"/);
                rendered.string.should.match(/"sameAs": "http:\/\/authorwebsite.com"/);
                rendered.string.should.match(/"headline": "Welcome to Ghost"/);
                rendered.string.should.match(/"url": "http:\/\/testurl.com\/post\/"/);
                rendered.string.should.match(/"@context": "http:\/\/schema.org"/);
                rendered.string.should.match(re3);
                rendered.string.should.match(re4);
                rendered.string.should.match(/"image": "http:\/\/testurl.com\/content\/images\/test-image.png"/);
                rendered.string.should.match(/"keywords": "tag1, tag2, tag3"/);
                rendered.string.should.match(/"description": "blog description..."/);
                rendered.string.should.match(/"@context": "http:\/\/schema.org"/);
                rendered.string.should.match(/<meta name="generator" content="Ghost 0.3" \/>/);
                rendered.string.should.match(/<link rel="alternate" type="application\/rss\+xml" title="Ghost" href="http:\/\/testurl.com\/rss\/" \/>/);

                done();
            }).catch(done);
        });

        it('returns structured data if metaTitle and metaDescription have double quotes', function (done) {
            var post = {
                meta_description: 'blog "test" description',
                title: 'title',
                meta_title: 'Welcome to Ghost "test"',
                image: '/content/images/test-image.png',
                published_at:  moment('2008-05-31T19:18:15').toISOString(),
                updated_at: moment('2014-10-06T15:23:54').toISOString(),
                tags: [{name: 'tag1'}, {name: 'tag2'}, {name: 'tag3'}],
                author: {
                    name: 'Author name',
                    url: 'http//:testauthorurl.com',
                    slug: 'Author',
                    image: '/content/images/test-author-image.png',
                    website: 'http://authorwebsite.com'
                }
            };

            helpers.ghost_head.call({relativeUrl: '/post/', version: '0.3.0', context: ['post'], post: post}).then(function (rendered) {
                var re1 = new RegExp('<meta property="article:published_time" content="' + post.published_at),
                    re2 = new RegExp('<meta property="article:modified_time" content="' + post.updated_at),
                    re3 = new RegExp('"datePublished": "' + post.published_at),
                    re4 = new RegExp('"dateModified": "' + post.updated_at);

                should.exist(rendered);
                rendered.string.should.equal('<link rel="canonical" href="http://testurl.com/post/" />\n    \n' +
                    '    <meta property="og:site_name" content="Ghost" />\n' +
                    '    <meta property="og:type" content="article" />\n' +
                    '    <meta property="og:title" content="Welcome to Ghost &quot;test&quot;" />\n' +
                    '    <meta property="og:description" content="blog &quot;test&quot; description..." />\n' +
                    '    <meta property="og:url" content="http://testurl.com/post/" />\n' +
                    '    <meta property="og:image" content="http://testurl.com/content/images/test-image.png" />\n' +
                    '    <meta property="article:published_time" content="' + post.published_at + '" />\n' +
                    '    <meta property="article:modified_time" content="' + post.updated_at + '" />\n' +
                    '    <meta property="article:tag" content="tag1" />\n' +
                    '    <meta property="article:tag" content="tag2" />\n' +
                    '    <meta property="article:tag" content="tag3" />\n    \n' +
                    '    <meta name="twitter:card" content="summary_large_image" />\n' +
                    '    <meta name="twitter:title" content="Welcome to Ghost &quot;test&quot;" />\n' +
                    '    <meta name="twitter:description" content="blog &quot;test&quot; description..." />\n' +
                    '    <meta name="twitter:url" content="http://testurl.com/post/" />\n' +
                    '    <meta name="twitter:image:src" content="http://testurl.com/content/images/test-image.png" />\n    \n' +
                    '    <script type=\"application/ld+json\">\n{\n' +
                    '    "@context": "http://schema.org",\n    "@type": "Article",\n    "publisher": "Ghost",\n' +
                    '    "author": {\n        "@type": "Person",\n        "name": "Author name",\n    ' +
                    '    \"image\": \"http://testurl.com/content/images/test-author-image.png\",\n    ' +
                    '    "url": "http://testurl.com/author/Author",\n        "sameAs": "http://authorwebsite.com"\n    ' +
                    '},\n    "headline": "Welcome to Ghost &quot;test&quot;",\n    "url": "http://testurl.com/post/",\n' +
                    '    "datePublished": "' + post.published_at + '",\n    "dateModified": "' + post.updated_at + '",\n' +
                    '    "image": "http://testurl.com/content/images/test-image.png",\n    "keywords": "tag1, tag2, tag3",\n' +
                    '    "description": "blog &quot;test&quot; description..."\n}\n    </script>\n\n' +
                    '    <meta name="generator" content="Ghost 0.3" />\n' +
                    '    <link rel="alternate" type="application/rss+xml" title="Ghost" href="http://testurl.com/rss/" />');

                rendered.string.should.match(/<link rel="canonical" href="http:\/\/testurl.com\/post\/" \/>/);
                rendered.string.should.match(/<meta property="og:site_name" content="Ghost" \/>/);
                rendered.string.should.match(/<meta property="og:type" content="article" \/>/);
                rendered.string.should.match(/<meta property="og:title" content="Welcome to Ghost &quot;test&quot;" \/>/);
                rendered.string.should.match(/<meta property="og:description" content="blog &quot;test&quot; description..." \/>/);
                rendered.string.should.match(/<meta property="og:url" content="http:\/\/testurl.com\/post\/" \/>/);
                rendered.string.should.match(/<meta property="og:image" content="http:\/\/testurl.com\/content\/images\/test-image.png" \/>/);
                rendered.string.should.match(re1);
                rendered.string.should.match(re2);
                rendered.string.should.match(/<meta property="article:tag" content="tag1" \/>/);
                rendered.string.should.match(/<meta property="article:tag" content="tag2" \/>/);
                rendered.string.should.match(/<meta property="article:tag" content="tag3" \/>/);
                rendered.string.should.match(/<meta name="twitter:card" content="summary_large_image" \/>/);
                rendered.string.should.match(/<meta name="twitter:title" content="Welcome to Ghost &quot;test&quot;" \/>/);
                rendered.string.should.match(/<meta name="twitter:description" content="blog &quot;test&quot; description..." \/>/);
                rendered.string.should.match(/<meta name="twitter:url" content="http:\/\/testurl.com\/post\/" \/>/);
                rendered.string.should.match(/<meta name="twitter:image:src" content="http:\/\/testurl.com\/content\/images\/test-image.png" \/>/);
                rendered.string.should.match(/<script type=\"application\/ld\+json\">/);
                rendered.string.should.match(/"@context": "http:\/\/schema.org"/);
                rendered.string.should.match(/"@type": "Article"/);
                rendered.string.should.match(/"publisher": "Ghost"/);
                rendered.string.should.match(/"author": {/);
                rendered.string.should.match(/"@type": "Person"/);
                rendered.string.should.match(/"name": "Author name"/);
                rendered.string.should.match(/"image\": \"http:\/\/testurl.com\/content\/images\/test-author-image.png\"/);
                rendered.string.should.match(/"url": "http:\/\/testurl.com\/author\/Author"/);
                rendered.string.should.match(/"sameAs": "http:\/\/authorwebsite.com"/);
                rendered.string.should.match(/"headline": "Welcome to Ghost &quot;test&quot;"/);
                rendered.string.should.match(/"url": "http:\/\/testurl.com\/post\/"/);
                rendered.string.should.match(/"@context": "http:\/\/schema.org"/);
                rendered.string.should.match(re3);
                rendered.string.should.match(re4);
                rendered.string.should.match(/"image": "http:\/\/testurl.com\/content\/images\/test-image.png"/);
                rendered.string.should.match(/"keywords": "tag1, tag2, tag3"/);
                rendered.string.should.match(/"description": "blog &quot;test&quot; description..."/);
                rendered.string.should.match(/"@context": "http:\/\/schema.org"/);
                rendered.string.should.match(/<meta name="generator" content="Ghost 0.3" \/>/);
                rendered.string.should.match(/<link rel="alternate" type="application\/rss\+xml" title="Ghost" href="http:\/\/testurl.com\/rss\/" \/>/);

                done();
            }).catch(done);
        });

        it('returns structured data without tags if there are no tags', function (done) {
            var post = {
                meta_description: 'blog description',
                title: 'Welcome to Ghost',
                image: '/content/images/test-image.png',
                published_at:  moment('2008-05-31T19:18:15').toISOString(),
                updated_at: moment('2014-10-06T15:23:54').toISOString(),
                tags: [],
                author: {
                    name: 'Author name',
                    url: 'http//:testauthorurl.com',
                    slug: 'Author',
                    image: '/content/images/test-author-image.png',
                    website: 'http://authorwebsite.com'
                }
            };

            helpers.ghost_head.call({relativeUrl: '/post/', version: '0.3.0', context: ['post'], post: post}).then(function (rendered) {
                var re1 = new RegExp('<meta property="article:published_time" content="' + post.published_at),
                    re2 = new RegExp('<meta property="article:modified_time" content="' + post.updated_at),
                    re3 = new RegExp('"datePublished": "' + post.published_at),
                    re4 = new RegExp('"dateModified": "' + post.updated_at);

                should.exist(rendered);

                rendered.string.should.match(/<link rel="canonical" href="http:\/\/testurl.com\/post\/" \/>/);
                rendered.string.should.match(/<meta property="og:site_name" content="Ghost" \/>/);
                rendered.string.should.match(/<meta property="og:type" content="article" \/>/);
                rendered.string.should.match(/<meta property="og:title" content="Welcome to Ghost" \/>/);
                rendered.string.should.match(/<meta property="og:description" content="blog description..." \/>/);
                rendered.string.should.match(/<meta property="og:url" content="http:\/\/testurl.com\/post\/" \/>/);
                rendered.string.should.match(/<meta property="og:image" content="http:\/\/testurl.com\/content\/images\/test-image.png" \/>/);
                rendered.string.should.match(re1);
                rendered.string.should.match(re2);
                rendered.string.should.not.match(/<meta property="article:tag"/);
                rendered.string.should.match(/<meta name="twitter:card" content="summary_large_image" \/>/);
                rendered.string.should.match(/<meta name="twitter:title" content="Welcome to Ghost" \/>/);
                rendered.string.should.match(/<meta name="twitter:description" content="blog description..." \/>/);
                rendered.string.should.match(/<meta name="twitter:url" content="http:\/\/testurl.com\/post\/" \/>/);
                rendered.string.should.match(/<meta name="twitter:image:src" content="http:\/\/testurl.com\/content\/images\/test-image.png" \/>/);
                rendered.string.should.match(/<script type=\"application\/ld\+json\">/);
                rendered.string.should.match(/"@context": "http:\/\/schema.org"/);
                rendered.string.should.match(/"@type": "Article"/);
                rendered.string.should.match(/"publisher": "Ghost"/);
                rendered.string.should.match(/"author": {/);
                rendered.string.should.match(/"@type": "Person"/);
                rendered.string.should.match(/"name": "Author name"/);
                rendered.string.should.match(/"image\": \"http:\/\/testurl.com\/content\/images\/test-author-image.png\"/);
                rendered.string.should.match(/"url": "http:\/\/testurl.com\/author\/Author"/);
                rendered.string.should.match(/"sameAs": "http:\/\/authorwebsite.com"/);
                rendered.string.should.match(/"headline": "Welcome to Ghost"/);
                rendered.string.should.match(/"url": "http:\/\/testurl.com\/post\/"/);
                rendered.string.should.match(/"@context": "http:\/\/schema.org"/);
                rendered.string.should.match(re3);
                rendered.string.should.match(re4);
                rendered.string.should.match(/"image": "http:\/\/testurl.com\/content\/images\/test-image.png"/);
                rendered.string.should.not.match(/"keywords":/);
                rendered.string.should.match(/"description": "blog description..."/);
                rendered.string.should.match(/"@context": "http:\/\/schema.org"/);
                rendered.string.should.match(/<meta name="generator" content="Ghost 0.3" \/>/);
                rendered.string.should.match(/<link rel="alternate" type="application\/rss\+xml" title="Ghost" href="http:\/\/testurl.com\/rss\/" \/>/);

                done();
            }).catch(done);
        });

        it('returns structured data on post page with null author image and post cover image', function (done) {
            var post = {
                meta_description: 'blog description',
                title: 'Welcome to Ghost',
                image: null,
                published_at:  moment('2008-05-31T19:18:15').toISOString(),
                updated_at: moment('2014-10-06T15:23:54').toISOString(),
                tags: [{name: 'tag1'}, {name: 'tag2'}, {name: 'tag3'}],
                author: {
                    name: 'Author name',
                    url: 'http//:testauthorurl.com',
                    slug: 'Author',
                    image: null,
                    website: 'http://authorwebsite.com'
                }
            };

            helpers.ghost_head.call({relativeUrl: '/post/', version: '0.3.0', post: post}).then(function (rendered) {
                should.exist(rendered);
                rendered.string.should.equal('<link rel="canonical" href="http://testurl.com/post/" />\n    \n' +
                    '    <meta property="og:site_name" content="Ghost" />\n' +
                    '    <meta property="og:type" content="article" />\n' +
                    '    <meta property="og:title" content="Welcome to Ghost" />\n' +
                    '    <meta property="og:description" content="blog description..." />\n' +
                    '    <meta property="og:url" content="http://testurl.com/post/" />\n' +
                    '    <meta property="article:published_time" content="' + post.published_at + '" />\n' +
                    '    <meta property="article:modified_time" content="' + post.updated_at + '" />\n' +
                    '    <meta property="article:tag" content="tag1" />\n' +
                    '    <meta property="article:tag" content="tag2" />\n' +
                    '    <meta property="article:tag" content="tag3" />\n    \n' +
                    '    <meta name="twitter:card" content="summary" />\n' +
                    '    <meta name="twitter:title" content="Welcome to Ghost" />\n' +
                    '    <meta name="twitter:description" content="blog description..." />\n' +
                    '    <meta name="twitter:url" content="http://testurl.com/post/" />\n    \n' +
                    '    <script type=\"application/ld+json\">\n{\n' +
                    '    "@context": "http://schema.org",\n    "@type": "Article",\n    "publisher": "Ghost",\n' +
                    '    "author": {\n        "@type": "Person",\n        "name": "Author name",\n    ' +
                    '    "url": "http://testurl.com/author/Author",\n        "sameAs": "http://authorwebsite.com"\n    ' +
                    '},\n    "headline": "Welcome to Ghost",\n    "url": "http://testurl.com/post/",\n' +
                    '    "datePublished": "' + post.published_at + '",\n    "dateModified": "' + post.updated_at + '",\n' +
                    '    "keywords": "tag1, tag2, tag3",\n    "description": "blog description..."\n}\n    </script>\n\n' +
                    '    <meta name="generator" content="Ghost 0.3" />\n' +
                    '    <link rel="alternate" type="application/rss+xml" title="Ghost" href="http://testurl.com/rss/" />');

                done();
            }).catch(done);
        });

        it('does not return structured data if useStructuredData is set to false in config file', function (done) {
            utils.overrideConfig({
                privacy: {
                    useStructuredData: false
                }
            });

            var post = {
                meta_description: 'blog description',
                title: 'Welcome to Ghost',
                image: 'content/images/test-image.png',
                published_at:  moment('2008-05-31T19:18:15').toISOString(),
                updated_at: moment('2014-10-06T15:23:54').toISOString(),
                tags: [{name: 'tag1'}, {name: 'tag2'}, {name: 'tag3'}],
                author: {
                    name: 'Author name',
                    url: 'http//:testauthorurl.com',
                    slug: 'Author',
                    image: 'content/images/test-author-image.png',
                    website: 'http://authorwebsite.com'
                }
            };

            helpers.ghost_head.call({relativeUrl: '/post/', version: '0.3.0', post: post}).then(function (rendered) {
                should.exist(rendered);
                rendered.string.should.equal('<link rel="canonical" href="http://testurl.com/post/" />\n' +
                    '    <meta name="generator" content="Ghost 0.3" />\n' +
                    '    <link rel="alternate" type="application/rss+xml" title="Ghost" href="http://testurl.com/rss/" />');

                done();
            }).catch(done);
        });

        it('returns canonical URL', function (done) {
            helpers.ghost_head.call({version: '0.3.0', relativeUrl: '/about/'}).then(function (rendered) {
                should.exist(rendered);
                rendered.string.should.equal('<link rel="canonical" href="http://testurl.com/about/" />\n' +
                    '    <meta name="generator" content="Ghost 0.3" />\n' +
                    '    <link rel="alternate" type="application/rss+xml" title="Ghost" href="http://testurl.com/rss/" />');

                done();
            }).catch(done);
        });

        it('returns next & prev URL correctly for middle page', function (done) {
            helpers.ghost_head.call({version: '0.3.0', relativeUrl: '/page/3/', pagination: {next: '4', prev: '2'}}).then(function (rendered) {
                should.exist(rendered);
                rendered.string.should.equal('<link rel="canonical" href="http://testurl.com/page/3/" />\n' +
                    '    <link rel="prev" href="http://testurl.com/page/2/" />\n' +
                    '    <link rel="next" href="http://testurl.com/page/4/" />\n' +
                    '    <meta name="generator" content="Ghost 0.3" />\n' +
                    '    <link rel="alternate" type="application/rss+xml" title="Ghost" href="http://testurl.com/rss/" />');
                done();
            }).catch(done);
        });

        it('returns next & prev URL correctly for second page', function (done) {
            helpers.ghost_head.call({version: '0.3.0', relativeUrl: '/page/2/', pagination: {next: '3', prev: '1'}}).then(function (rendered) {
                should.exist(rendered);
                rendered.string.should.equal('<link rel="canonical" href="http://testurl.com/page/2/" />\n' +
                    '    <link rel="prev" href="http://testurl.com/" />\n' +
                    '    <link rel="next" href="http://testurl.com/page/3/" />\n' +
                    '    <meta name="generator" content="Ghost 0.3" />\n' +
                    '    <link rel="alternate" type="application/rss+xml" title="Ghost" href="http://testurl.com/rss/" />');
                done();
            }).catch(done);
        });

        describe('with /blog subdirectory', function () {
            before(function () {
                utils.overrideConfig({
                    url: 'http://testurl.com/blog/',
                    theme: {
                        title: 'Ghost'
                    }
                });
            });

            after(function () {
                utils.restoreConfig();
            });

            it('returns correct rss url with subdirectory', function (done) {
                helpers.ghost_head.call({version: '0.3.0'}).then(function (rendered) {
                    should.exist(rendered);
                    rendered.string.should.equal('<link rel="canonical" href="http://testurl.com/blog/" />\n' +
                        '    <meta name="generator" content="Ghost 0.3" />\n' +
                        '    <link rel="alternate" type="application/rss+xml" title="Ghost" ' +
                        'href="http://testurl.com/blog/rss/" />');

                    done();
                }).catch(done);
            });
        });
    });

    describe('with Code Injection', function () {
        before(function () {
            sandbox = sinon.sandbox.create();
            sandbox.stub(api.settings, 'read', function () {
                return Promise.resolve({
                    settings: [{value: '<style>body {background: red;}</style>'}]
                });
            });
            utils.overrideConfig({
                url: 'http://testurl.com/',
                theme: {
                    title: 'Ghost'
                }
            });
        });

        after(function () {
            sandbox.restore();
            utils.restoreConfig();
        });

        it('returns meta tag plus injected code', function (done) {
            helpers.ghost_head.call({version: '0.3.0', post: false}).then(function (rendered) {
                should.exist(rendered);
                rendered.string.should.equal('<link rel="canonical" href="http://testurl.com/" />\n' +
                    '    <meta name="generator" content="Ghost 0.3" />\n' +
                    '    <link rel="alternate" type="application/rss+xml" title="Ghost" href="http://testurl.com/rss/" />\n' +
                    '    <style>body {background: red;}</style>');

                done();
            }).catch(done);
        });
    });
});
