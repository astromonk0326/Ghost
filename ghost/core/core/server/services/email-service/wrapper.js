const logging = require('@tryghost/logging');
const ObjectID = require('bson-objectid').default;

class EmailServiceWrapper {
    init() {
        const {EmailService, EmailController, EmailRenderer, SendingService, BatchSendingService, EmailSegmenter, MailgunEmailProvider} = require('@tryghost/email-service');
        const {Post, Newsletter, Email, EmailBatch, EmailRecipient, Member} = require('../../models');
        const MailgunClient = require('@tryghost/mailgun-client');
        const configService = require('../../../shared/config');
        const settingsCache = require('../../../shared/settings-cache');
        const settingsHelpers = require('../../services/settings-helpers');
        const jobsService = require('../jobs');
        const membersService = require('../members');
        const db = require('../../data/db');
        const sentry = require('../../../shared/sentry');
        const membersRepository = membersService.api.members;
        const limitService = require('../limits');

        const mobiledocLib = require('../../lib/mobiledoc');
        const lexicalLib = require('../../lib/lexical');
        const url = require('../../../server/api/endpoints/utils/serializers/output/utils/url');
        const urlUtils = require('../../../shared/url-utils');
        const memberAttribution = require('../member-attribution');
        const linkReplacer = require('@tryghost/link-replacer');
        const linkTracking = require('../link-tracking');
        const audienceFeedback = require('../audience-feedback');

        // capture errors from mailgun client and log them in sentry
        const errorHandler = (error) => {
            logging.info(`Capturing error for mailgun email provider service`);
            sentry.captureException(error);
        };

        // Mailgun client instance for email provider
        const mailgunClient = new MailgunClient({
            config: configService, settings: settingsCache
        });

        const mailgunEmailProvider = new MailgunEmailProvider({
            mailgunClient,
            errorHandler
        });

        const emailRenderer = new EmailRenderer({
            settingsCache,
            settingsHelpers,
            renderers: {
                mobiledoc: mobiledocLib.mobiledocHtmlRenderer,
                lexical: lexicalLib.lexicalHtmlRenderer
            },
            imageSize: null,
            urlUtils,
            getPostUrl: (post) => {
                const jsonModel = post.toJSON();
                url.forPost(post.id, jsonModel, {options: {}});
                return jsonModel.url;
            },
            linkReplacer,
            linkTracking,
            memberAttributionService: memberAttribution.service,
            audienceFeedbackService: audienceFeedback.service
        });

        const sendingService = new SendingService({
            emailProvider: mailgunEmailProvider,
            emailRenderer
        });

        const emailSegmenter = new EmailSegmenter({
            membersRepository
        });
        const batchSendingService = new BatchSendingService({
            sendingService,
            models: {
                EmailBatch,
                EmailRecipient,
                Email,
                Member
            },
            jobsService,
            emailSegmenter,
            emailRenderer,
            db
        });

        this.service = new EmailService({
            batchSendingService,
            models: {
                Email
            },
            settingsCache,
            emailRenderer,
            emailSegmenter,
            limitService
        });

        this.controller = new EmailController(this.service, {
            models: {
                Post,
                Newsletter,
                Email
            }
        });
    }
}

module.exports = EmailServiceWrapper;
