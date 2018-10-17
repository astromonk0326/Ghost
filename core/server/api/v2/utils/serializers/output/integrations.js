const debug = require('ghost-ignition').debug('api:v2:utils:serializers:output:integrations');

module.exports = {
    browse({data, meta}, apiConfig, frame) {
        debug('browse');

        frame.response = {
            integrations: data.map(model => model.toJSON(frame.options)),
            meta
        };
    },
    read(model, apiConfig, frame) {
        debug('read');

        frame.response = {
            integrations: [model.toJSON()]
        };
    },
    add(model, apiConfig, frame) {
        debug('add');

        frame.response = {
            integrations: [model.toJSON()]
        };
    }
};

