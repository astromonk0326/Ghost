//stats helper
const moment = require('moment-timezone');
const Promise = require('bluebird');

const dateFormat = 'YYYY-MM-DD HH:mm:ss';

class Stats {
    /**
     * @param {Object} config
     * @param {Object} config.db - an instance holding knex connection to the database
     * @param {Object} config.settingsCache - an instance of the Ghost Settings Cache
     * @param {Boolean} config.isSQLite - flag identifying if storage is connected to SQLite
     */
    constructor({db, settingsCache, isSQLite}) {
        this._db = db;
        this._settingsCache = settingsCache;
        this._isSQLite = isSQLite;
    }
    
    /**
     * Fetches count of all members
     */
    async getTotalMembers() {
        const result = await this._db.knex.raw('SELECT COUNT(id) AS total FROM members');
        return this._isSQLite ? result[0].total : result[0][0].total;
    }
    
    /**
     * Fetches count of all posts
     */
    async getTotalPosts() {
        const result = await this._db.knex.raw('SELECT COUNT(id) AS total FROM posts');
        return this._isSQLite ? result[0].total : result[0][0].total;
    }
    async getTotalPosts2() {
        const knex = require('knex')({
            client: 'sqlite3',
            connection: {
              filename: '../../../content/data/ghost-dev.db',
            },
          });
        const result = await knex.raw('SELECT COUNT(id) AS total FROM posts');
        return this._isSQLite ? result[0].total : result[0][0].total;
    }
    /**
     * Fetches member's signup statistics
     *
     */
    async fetch() {
        const totalMembers = await this.getTotalMembers();

        // perform final calculations in parallel
        const results = await Promise.props({
            total: totalMembers,

        });

        return results;
    }
    async testPosts() {
        const result = await this._db.knex.raw('SELECT title FROM posts');
        return result
    }
    async testMembers() {
        const result = await this._db.knex.raw('SELECT name FROM members');
        return result
    }

}

module.exports = Stats;
