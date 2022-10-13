// # t helper
// i18n: Translatable handlebars expressions for templates of the front-end and themes.
// Front-end: .hbs templates in core/server, overridden by copies in themes. Themes: in content/themes.
//
// Usage examples, for example in .hbs theme templates:
// {{t "Get the latest posts delivered right to your inbox"}}
// {{{t "Proudly published with {ghostlink}" ghostlink="<a href=\"https://ghost.org\">Ghost</a>"}}}
//
// To preserve HTML, use {{{t}}}. This helper doesn't use a SafeString object which would prevent escaping,
// because often other helpers need that (t) returns a string to be able to work as subexpression; e.g.:
// {{tags prefix=(t " on ")}}

const {themeI18n} = require('../services/handlebars');

module.exports = function t(text, options) {
    // checks for smart apostrophes, eg. https://unicode-table.com/en/201C/
    const quoteTest = /[\u201C\u201D\u201F]/u;

    if ((quoteTest.test(text)) || (text === undefined && options === undefined)) {
        throw new errors.IncorrectUsageError({
            message: tpl(messages.oopsErrorTemplateHasError)
        });
    }

    const bindings = {};
    let prop;
    for (prop in options.hash) {
        if (Object.prototype.hasOwnProperty.call(options.hash, prop)) {
            bindings[prop] = options.hash[prop];
        }
    }

    return themeI18n.t(text, bindings);
};
