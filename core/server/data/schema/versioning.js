var Promise = require('bluebird'),
    db = require('../db'),
    errors = require('../../errors'),
    ghostVersion = require('../../utils/ghost-version');

/**
 * Database version has always two digits
 * Database version is Ghost Version X.X
 *
 * @TODO: remove alpha text!
 * @TODO: extend database validation
 */
function validateDatabaseVersion(version) {
    if (version === null) {
        throw new errors.DatabaseVersionError({
            code: 'VERSION_DOES_NOT_EXIST'
        });
    }

    if (!version.match(/\d\.\d/gi)) {
        throw new errors.DatabaseVersionError({
            message: 'Your database version is not compatible with Ghost 1.0.0 Alpha (master branch)',
            context: 'Want to keep your DB? Use Ghost < 1.0.0 or the "stable" branch. Otherwise please delete your DB and restart Ghost',
            help: 'More information on the Ghost 1.0.0 Alpha at https://support.ghost.org/v1-0-alpha'
        });
    }

    return version;
}

/**
 * If the database version is null, the database was never seeded.
 * The init migration script will set your database to current Ghost Version.
 */
function getDatabaseVersion(options) {
    options = options || {};

    return (options.transacting || db.knex).schema.hasTable('settings')
        .then(function (exists) {
            if (!exists) {
                return Promise.reject(new errors.DatabaseVersionError({
                    code: 'SETTINGS_TABLE_DOES_NOT_EXIST'
                }));
            }

            return (options.transacting || db.knex)('settings')
                .where('key', 'databaseVersion')
                .first('value')
                .then(function (version) {
                    return validateDatabaseVersion(version ? version.value : null);
                });
        });
}

function getNewestDatabaseVersion() {
    return ghostVersion.safe;
}

/**
 * Database version cannot set from outside.
 * If this function get called, we set the database version to your current Ghost version.
 */
function setDatabaseVersion(options) {
    options = options || {};

    return (options.transacting || db.knex)('settings')
        .where('key', 'databaseVersion')
        .update({
            value: getNewestDatabaseVersion()
        });
}

module.exports = {
    canMigrateFromVersion: '1.0',
    getNewestDatabaseVersion: getNewestDatabaseVersion,
    getDatabaseVersion: getDatabaseVersion,
    setDatabaseVersion: setDatabaseVersion
};
