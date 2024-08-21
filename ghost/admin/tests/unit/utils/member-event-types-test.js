import {describe, it} from 'mocha';
import {expect} from 'chai';
import {getAvailableEventTypes, needDivider, toggleEventType} from 'ghost-admin/utils/member-event-types';

describe('Unit | Utility | event-type-utils', function () {
    it('should return available event types with settings and features applied', function () {
        const settings = {
            commentsEnabled: 'on',
            emailTrackClicks: true
        };
        const feature = {
            audienceFeedback: true,
            tipsAndDonations: true
        };
        const hiddenEvents = [];

        const eventTypes = getAvailableEventTypes(settings, feature, hiddenEvents);

        expect(eventTypes).to.deep.include({event: 'comment_event', icon: 'filter-dropdown-comments', name: 'Comments', group: 'others'});
        expect(eventTypes).to.deep.include({event: 'feedback_event', icon: 'filter-dropdown-feedback', name: 'Feedback', group: 'others'});
        expect(eventTypes).to.deep.include({event: 'click_event', icon: 'filter-dropdown-clicked-in-email', name: 'Clicked link in email', group: 'others'});
        expect(eventTypes).to.deep.include({event: 'donation_event', icon: 'filter-dropdown-donations', name: 'Donations', group: 'payments', hidden: true});
    });

    it('should toggle both payment_event and donation_event when tipsAndDonations is enabled', function () {
        const eventTypes = [
            {event: 'payment_event', isSelected: true},
            {event: 'donation_event', isSelected: true}
        ];
        const feature = {
            tipsAndDonations: true
        };

        const newExcludedEvents = toggleEventType('payment_event', eventTypes, feature);

        expect(newExcludedEvents).to.equal('payment_event,donation_event');
    });

    it('should return correct divider need based on event groups', function () {
        const event = {group: 'auth'};
        const prevEvent = {group: 'payments'};

        const result = needDivider(event, prevEvent);

        expect(result).to.be.true;
    });
});
