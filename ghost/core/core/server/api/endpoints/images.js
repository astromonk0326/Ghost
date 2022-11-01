const storage = require('../../adapters/storage');

module.exports = {
    docName: 'images',
    upload: {
        statusCode: 201,
        permissions: false,
        query(frame) {
            const store = storage.getStorage('images');

            if (frame.files) {
                return Promise
                    .all(frame.files.map((file) => store.save(file)))
                    .then(paths => paths[0]);
            }
            return store.save(frame.file);
        }
    }
};
