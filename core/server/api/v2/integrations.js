const models = require('../../models');

module.exports = {
    docName: 'integrations',
    browse: {},
    read: {},
    edit: {},
    add: {
        permissions: true,
        data: [
            'name',
            'icon_image',
            'description',
            'webhooks'
        ],
        options: [
            'include'
        ],
        validation: {
            data: {
                name: {
                    required: true
                }
            },
            options: {
                include: {
                    values: ['api_keys', 'webhooks']
                }
            }
        },
        query({data, options}) {
            return models.Base.transaction((transacting) => {
                const optionsWithTransacting = Object.assign({transacting}, options);
                const dataWithApiKeys = Object.assign({
                    api_keys: [
                        {type: 'content'},
                        {type: 'admin'}
                    ]
                }, data);
                return models.Integration.add(dataWithApiKeys, optionsWithTransacting);
            }).then((model) => {
                return model.fetch(options);
            });
        }
    },
    destroy: {}
};
