/* eslint-disable camelcase */
import Model, {attr} from '@ember-data/model';
import ValidationEngine from 'ghost-admin/mixins/validation-engine';

export default Model.extend(ValidationEngine, {
    validationType: 'setting',

    title: attr('string'),
    description: attr('string'),
    logo: attr('string'),
    coverImage: attr('string'),
    icon: attr('string'),
    accentColor: attr('string'),
    lang: attr('string'),
    timezone: attr('string', {defaultValue: 'Etc/UTC'}),
    codeinjectionHead: attr('string'),
    codeinjectionFoot: attr('string'),
    facebook: attr('facebook-url-user'),
    twitter: attr('twitter-url-user'),
    labs: attr('string'),
    navigation: attr('navigation-settings'),
    secondaryNavigation: attr('navigation-settings', {isSecondary: true}),
    isPrivate: attr('boolean'),
    publicHash: attr('string'),
    password: attr('string'),
    slack: attr('slack-settings'),
    amp: attr('boolean'),
    ampGtagId: attr('string'),
    unsplash: attr('unsplash-settings', {
        defaultValue() {
            return {isActive: true};
        }
    }),
    metaTitle: attr('string'),
    metaDescription: attr('string'),
    twitterTitle: attr('string'),
    twitterDescription: attr('string'),
    twitterImage: attr('string'),
    ogTitle: attr('string'),
    ogDescription: attr('string'),
    ogImage: attr('string'),
    mailgunApiKey: attr('string'),
    mailgunDomain: attr('string'),
    mailgunBaseUrl: attr('string'),
    portalButton: attr('boolean'),
    portalName: attr('boolean'),
    portalPlans: attr('json-string'),
    portalButtonStyle: attr('string'),
    portalButtonIcon: attr('string'),
    portalButtonSignupText: attr('string'),
    sharedViews: attr('string'),
    /**
     * Members settings
     */
    defaultContentVisibility: attr('string'),
    membersAllowFreeSignup: attr('boolean'),
    membersFromAddress: attr('string'),
    membersSupportAddress: attr('string'),
    membersReplyAddress: attr('string'),
    membersPaidSignupRedirect: attr('string'),
    membersFreeSignupRedirect: attr('string'),
    stripeProductName: attr('string'),
    stripeSecretKey: attr('string'),
    stripePublishableKey: attr('string'),
    stripePlans: attr('json-string'),
    stripeConnectIntegrationToken: attr('string'),
    stripeConnectPublishableKey: attr('string'),
    stripeConnectSecretKey: attr('string'),
    stripeConnectLivemode: attr('boolean'),
    stripeConnectDisplayName: attr('string'),
    stripeConnectAccountId: attr('string'),
    /**
    * Newsletter settings
    */
    newsletterShowHeader: attr('boolean'),
    newsletterBodyFontCategory: attr('string'),
    newsletterShowBadge: attr('boolean'),
    newsletterFooterContent: attr('string')
});
