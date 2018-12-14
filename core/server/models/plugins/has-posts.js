const _ = require('lodash');
const _debug = require('ghost-ignition').debug._base;
const debug = _debug('ghost-query');

const addHasPostsWhere = function () {
    const tableName = _.result(this, 'tableName');
    const comparisonField = `${tableName}.id`;
    const config = this.shouldHavePosts;

    this.query(function (qb) {
        return qb.whereIn(comparisonField, function () {
            const innerQb = this
                .distinct(`${config.joinTable}.${config.joinTo}`)
                .select()
                .from(config.joinTable)
                .whereRaw(`${config.joinTable}.${config.joinTo} = ${comparisonField}`)
                .join('posts', 'posts.id', `${config.joinTable}.post_id`)
                .andWhere('posts.status', '=', 'published');

            debug(`QUERY has posts: ${innerQb.toSQL().sql}`);

            return innerQb;
        });
    });
};

const hasPosts = function hasPosts(Bookshelf) {
    const modelPrototype = Bookshelf.Model.prototype;

    Bookshelf.Model = Bookshelf.Model.extend({
        initialize: function () {
            return modelPrototype.initialize.apply(this, arguments);
        },

        fetch: function () {
            if (this.shouldHavePosts) {
                addHasPostsWhere.call(this);
            }

            if (_debug.enabled('ghost-query')) {
                debug('QUERY', this.query().toQuery());
            }

            return modelPrototype.fetch.apply(this, arguments);
        },

        fetchAll: function () {
            if (this.shouldHavePosts) {
                addHasPostsWhere.call(this);
            }

            if (_debug.enabled('ghost-query')) {
                debug('QUERY', this.query().toQuery());
            }

            return modelPrototype.fetchAll.apply(this, arguments);
        }
    });
};

module.exports = hasPosts;
