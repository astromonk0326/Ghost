const fs = require('fs-extra');

// const activate = require('./activate');
const validate = require('./validate');
const Storage = require('./Storage');
const themeLoader = require('./loader');
const toJSON = require('./to-json');

const common = require('../../../server/lib/common');
const debug = require('ghost-ignition').debug('api:themes');

let themeStorage;

const getStorage = () => {
    themeStorage = themeStorage || new Storage();

    return themeStorage;
};

module.exports = {
    get: require('./to-json'),
    setFromZip: (zip) => {
        // check if zip name is casper.zip
        if (zip.name === 'casper.zip') {
            throw new common.errors.ValidationError({
                message: common.i18n.t('errors.api.themes.overrideCasper')
            });
        }

        let checkedTheme;

        return validate.checkSafe(zip, true)
            .then((_checkedTheme) => {
                checkedTheme = _checkedTheme;

                return getStorage().exists(zip.shortName);
            })
            .then((themeExists) => {
                // CASE: delete existing theme
                if (themeExists) {
                    return getStorage().delete(zip.shortName);
                }
            })
            .then(() => {
                // CASE: store extracted theme
                return getStorage().save({
                    name: zip.shortName,
                    path: checkedTheme.path
                });
            })
            .then(() => {
                // CASE: loads the theme from the fs & sets the theme on the themeList
                return themeLoader.loadOneTheme(zip.shortName);
            })
            .then((loadedTheme) => {
                // CASE: if this is the active theme, we are overriding
                if (zip.shortName === settingsCache.get('active_theme')) {
                    debug('Activating theme (method C, on API "override")', zip.shortName);
                    activate(loadedTheme, checkedTheme);

                    // CASE: clear cache
                    this.headers.cacheInvalidate = true;
                }

                common.events.emit('theme.uploaded');

                // @TODO: unify the name across gscan and Ghost!
                return toJSON(zip.shortName, checkedTheme);
            })
            .finally(() => {
                // @TODO: we should probably do this as part of saving the theme
                // CASE: remove extracted dir from gscan
                // happens in background
                if (checkedTheme) {
                    fs.remove(checkedTheme.path)
                        .catch((err) => {
                            common.logging.error(new common.errors.GhostError({err: err}));
                        });
                }
            });
    }
};
