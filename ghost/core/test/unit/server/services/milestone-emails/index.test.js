const models = require('../../../../../core/server/models');
const assert = require('assert');

describe('Milestone Emails Service', function () {
    let milestoneEmails;

    before(function () {
        models.init();
    });

    describe('Milestone Emails Service', function () {
        it('Provides expected public API', async function () {
            milestoneEmails = require('../../../../../core/server/services/milestone-emails');

            assert.ok(milestoneEmails.initAndRun);
        });
    });
});
