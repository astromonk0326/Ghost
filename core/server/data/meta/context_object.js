const settingsCache = require('../../services/settings/cache'),
    _ = require('lodash');

function getContextObject(data, context) {
    /**
     * If the data object does not contain the requested context, we return the fallback object.
     */
    let blog = {
            cover_image: settingsCache.get('cover_image'),
            twitter: settingsCache.get('twitter'),
            facebook: settingsCache.get('facebook')
        },
        contextObject;

    let containsPageCtx = _.includes(context, 'page');

    context = containsPageCtx || _.includes(context, 'amp') ? 'post' : context;

    // If context is [{post-slug}, page] then data is available under `page` key
    if (containsPageCtx && data.page) {
        context = 'page';
    }

    contextObject = data[context] || blog;
    return contextObject;
}

module.exports = getContextObject;
