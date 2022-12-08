const {expect, test} = require('@playwright/test');
const {DateTime} = require('luxon');
const {createMember} = require('../utils');

/**
 * Start a post draft with a filled in title and body. We can consider to move this to utils later.
 * @param {import('@playwright/test').Page} page
 * @param {Object} options
 * @param {String} [options.title]
 * @param {String} [options.body]
 */
const createPost = async (page, {title = 'Hello world', body = 'This is my post body.'} = {}) => {
    await page.locator('.gh-nav a[href="#/posts/"]').click();

    // Create a new post
    await page.locator('[data-test-new-post-button]').click();

    // Fill in the post title
    await page.locator('[data-test-editor-title-input]').click();
    await page.locator('[data-test-editor-title-input]').fill(title);

    // Continue to the body by pressing enter
    await page.keyboard.press('Enter');

    await page.waitForTimeout(100); // allow new->draft switch to occur fully, without this some initial typing events can be missed
    await page.keyboard.type(body);
};

/**
 * @param {import('@playwright/test').Page} page
 */
const openPublishFlow = async (page) => {
    await page.locator('[data-test-button="publish-flow"]').click();
};

/**
 * @param {import('@playwright/test').Page} page
 */
const closePublishFlow = async (page) => {
    await page.locator('[data-test-button="close-publish-flow"]').click();
};

/**
 * @param {import('@playwright/test').Page} page
 */
const openUpdateFlow = async (page) => {
    await page.locator('[data-test-button="update-flow"]').click();
};

/**
 * @typedef {Object} PublishOptions
 * @property {'publish'|'publish+send'|'send'} [type]
 * @property {String} [recipientFilter]
 * @property {String} [newsletter]
 * @property {String} [date]
 * @property {String} [time]
 */

/**
 * Open and complete publish flow, filling in all necessary fields based on publish options
 * @param {import('@playwright/test').Page} page
 * @param {PublishOptions} options
 */
const publishPost = async (page, {type = 'publish', time} = {}) => {
    await openPublishFlow(page);

    // set the publish type
    await page.locator('[data-test-setting="publish-type"] > button').click();
    // NOTE: the if/else below should be reworked into data-test-publish style selectors
    // await page.locator(`[data-test-publish-type="${type}"]`).setChecked(true);
    if (type === 'publish') {
        await page.getByText('Publish only').click();
    } else if (type === 'publish+send') {
        await page.getByText('Publish and email').click();
    } else if (type === 'send') {
        await page.getByText('Email only').click();
    }
    
    if (time) {
        await page.locator('[data-test-setting="publish-at"] > button').click();
        await page.locator('[data-test-radio="schedule"] + label').click();
        await page.locator('[data-test-date-time-picker-time-input]').fill(time);
    }

    // TODO: set other publish options

    // continue to confirmation step
    await page.locator('[data-test-modal="publish-flow"] [data-test-button="continue"]').click();

    // TODO: assert publish flow has expected confirmation details

    // (we need force because the button is animating)
    await page.locator('[data-test-modal="publish-flow"] [data-test-button="confirm-publish"]').click({force: true});

    // TODO: assert publish flow has expected completion details

    // open the published post in a new tab
    const [frontendPage] = await Promise.all([
        page.waitForEvent('popup'),
        page.locator('[data-test-complete-bookmark]').click()
    ]);

    await closePublishFlow(page);
    return frontendPage;
};

/**
 * @param {import('@playwright/test').Page} page
 */
const unpublishPost = async (page) => {
    await openUpdateFlow(page);
    const unpublishButton = page.locator('[data-test-modal="update-flow"] [data-test-button="revert-to-draft"]');
    await unpublishButton.click();

    await expect(page.locator('[data-test-modal="update-flow"]')).not.toBeVisible();
    await expect(page.locator('[data-test-editor-post-status]')).toContainText('Draft');
};

test.describe('Publishing', () => {
    test.describe('Publish post', () => {
        test('Post should only be available on web', async ({page}) => {
            await page.goto('/ghost');
            await createPost(page);
            const frontendPage = await publishPost(page);

            // Check if 'This is my post body.' is present on page1
            await expect(frontendPage.locator('.gh-canvas .article-title')).toHaveText('Hello world');
            await expect(frontendPage.locator('.gh-content.gh-canvas > p')).toHaveText('This is my post body.');
        });
    });

    test.describe('Update post', () => {
        test('Can update a published post', async ({page: adminPage, browser}) => {
            await adminPage.goto('/ghost');

            const date = DateTime.now();

            await createPost(adminPage, {title: 'Testing publish update', body: 'This is the initial published text.'});
            const frontendPage = await publishPost(adminPage);
            const frontendBody = frontendPage.getByRole('main');

            // check front-end post has the initial body text
            await expect(frontendBody).toContainText('This is the initial published text.');
            await expect(frontendBody).toContainText(date.toFormat('LLL d, yyyy'));

            // add some extra text to the post
            await adminPage.locator('[data-kg="editor"]').click();
            await adminPage.keyboard.press('Enter');
            await adminPage.keyboard.type('This is some updated text.');

            // change some post settings
            await adminPage.locator('[data-test-psm-trigger]').click();
            await adminPage.fill('[data-test-date-time-picker-date-input]', '2022-01-07');
            await adminPage.fill('[data-test-field="custom-excerpt"]', 'Short description and meta');

            // save
            await adminPage.locator('[data-test-button="publish-save"]').click();

            // check front-end has new text after reloading
            await frontendPage.waitForTimeout(100); // let save go through
            await frontendPage.reload();
            await expect(frontendBody).toContainText('This is some updated text.');
            await expect(frontendBody).toContainText('Jan 7, 2022');
            const metaDescription = frontendPage.locator('meta[name="description"]');
            await expect(metaDescription).toHaveAttribute('content', 'Short description and meta');
        });

        test('Can unpublish a published post and re-publish with send', async ({page: adminPage, browser}) => {
            await adminPage.goto('/ghost');

            // create a member so publish+send option is available
            await createMember(adminPage, {email: 'test@example.com'});

            // TODO: enable mailgun - publish+send isn't available without it

            // publish a post
            await createPost(adminPage);
            const frontendPage = await publishPost(adminPage);

            // unpublish it
            await unpublishPost(adminPage);

            // check post is no longer available on frontend
            const afterUnpubResponse = await frontendPage.reload();
            await expect(afterUnpubResponse.status()).toBe(404);

            // re-publish with publish+send
            await publishPost(adminPage, {type: 'publish+send'});

            // admin shows correct post status
            await expect(adminPage.locator('[data-test-editor-post-status]')).toContainText('Published and sent');

            // page is available on the frontend again
            const afterRepubResponse = await frontendPage.reload();
            await expect(afterRepubResponse.status()).toBe(200);

            // TODO: check email was sent
        });
    });

    test.describe('Schedule post', () => {
        test('Post should be published to web only at the scheduled time', async ({page}) => {
            await page.goto('/ghost');
            await createPost(page, {
                title: 'Scheduled post test',
                body: 'This is my scheduled post body.'
            });

            // Schedule the post to publish asap (by setting it to 00:00, it will get auto corrected to the minimum time possible - 5 seconds in the future)
            await publishPost(page, {time: '00:00'});

            // Go to the homepage and check if the post is not yet visible there
            await page.goto('/');

            let lastPost = await page.locator('.post-card-content-link').first();
            await expect(lastPost).not.toHaveAttribute('href', '/scheduled-post-test/');

            // Now wait for 5 seconds
            await page.waitForTimeout(5000);

            // Check again, now it should have been added to the page
            await page.reload();
            lastPost = await page.locator('.post-card-content-link').first();
            await expect(lastPost).toHaveAttribute('href', '/scheduled-post-test/');

            // Go to the page
            await lastPost.click();

            // Check if the title and body are present on this page
            await expect(page.locator('.gh-canvas .article-title')).toHaveText('Scheduled post test');
            await expect(page.locator('.gh-content.gh-canvas > p')).toHaveText('This is my scheduled post body.');
        });
    });
});
