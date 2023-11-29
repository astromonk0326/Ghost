import {Config, hasSendingDomain, isManagedEmail, sendingDomain} from '@tryghost/admin-x-framework/api/config';
import {Newsletter} from '@tryghost/admin-x-framework/api/newsletters';

export const renderSenderEmail = (newsletter: Newsletter, config: Config, defaultEmailAddress: string|undefined) => {
    if (isManagedEmail(config) && !hasSendingDomain(config) && defaultEmailAddress) {
        // Not changeable: sender_email is ignored
        return defaultEmailAddress;
    }

    if (isManagedEmail(config) && hasSendingDomain(config)) {
        // Only return sender_email if the domain names match
        if (newsletter.sender_email?.split('@')[1] === sendingDomain(config)) {
            return newsletter.sender_email;
        } else {
            return defaultEmailAddress || '';
        }
    }

    return newsletter.sender_email || defaultEmailAddress || '';
};

export const renderReplyToEmail = (newsletter: Newsletter, config: Config, supportEmailAddress: string|undefined, defaultEmailAddress: string|undefined) => {
    if (newsletter.sender_reply_to === 'newsletter') {
        if (isManagedEmail(config) && hasSendingDomain(config)) {
            // No reply-to set
            // sender_reply_to currently doesn't allow empty values, we need to set it to 'newsletter'
            return '';
        }
        return renderSenderEmail(newsletter, config, defaultEmailAddress);
    }

    if (newsletter.sender_reply_to === 'support') {
        return supportEmailAddress || defaultEmailAddress || '';
    }

    return newsletter.sender_reply_to;
};
