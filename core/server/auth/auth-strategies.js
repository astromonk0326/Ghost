var _ = require('lodash'),
    Promise = require('bluebird'),
    models = require('../models'),
    utils = require('../utils'),
    i18n = require('../i18n'),
    errors = require('../errors'),
    strategies;

strategies = {

    /**
     * ClientPasswordStrategy
     *
     * This strategy is used to authenticate registered OAuth clients.  It is
     * employed to protect the `token` endpoint, which consumers use to obtain
     * access tokens.  The OAuth 2.0 specification suggests that clients use the
     * HTTP Basic scheme to authenticate (not implemented yet).
     * Use of the client password strategy is implemented to support ember-simple-auth.
     */
    clientPasswordStrategy: function clientPasswordStrategy(clientId, clientSecret, done) {
        return models.Client.findOne({slug: clientId}, {withRelated: ['trustedDomains']})
            .then(function then(model) {
                if (model) {
                    var client = model.toJSON({include: ['trustedDomains']});
                    if (client.status === 'enabled' && client.secret === clientSecret) {
                        return done(null, client);
                    }
                }
                return done(null, false);
            });
    },

    /**
     * BearerStrategy
     *
     * This strategy is used to authenticate users based on an access token (aka a
     * bearer token).  The user must have previously authorized a client
     * application, which is issued an access token to make requests on behalf of
     * the authorizing user.
     */
    bearerStrategy: function bearerStrategy(accessToken, done) {
        return models.Accesstoken.findOne({token: accessToken})
            .then(function then(model) {
                if (model) {
                    var token = model.toJSON();
                    if (token.expires > Date.now()) {
                        return models.User.findOne({id: token.user_id})
                            .then(function then(model) {
                                if (!model) {
                                    return done(null, false);
                                }

                                if (model.get('status') === 'inactive') {
                                    throw new errors.NoPermissionError({
                                        message: 'You were suspended from this blog.'
                                    });
                                }

                                var user = model.toJSON(),
                                    info = {scope: '*'};

                                return done(null, {id: user.id}, info);
                            })
                            .catch(function (err) {
                                return done(err);
                            });
                    } else {
                        return done(null, false);
                    }
                } else {
                    return done(null, false);
                }
            });
    },

    /**
     * Ghost Strategy
     * ghostAuthRefreshToken: will be null for now, because we don't need it right now
     *
     * CASES:
     * - via invite token
     * - via normal sign in
     * - via setup
     */
    ghostStrategy: function ghostStrategy(req, ghostAuthAccessToken, ghostAuthRefreshToken, profile, done) {
        var inviteToken = req.body.inviteToken,
            options = {context: {internal: true}},
            handleInviteToken, handleSetup, handleSignIn;

        // CASE: socket hangs up for example
        if (!ghostAuthAccessToken || !profile) {
            return done(new errors.NoPermissionError({
                help: 'Please try again.'
            }));
        }

        handleInviteToken = function handleInviteToken() {
            var user, invite;
            inviteToken = utils.decodeBase64URLsafe(inviteToken);

            return models.Invite.findOne({token: inviteToken}, options)
                .then(function addInviteUser(_invite) {
                    invite = _invite;

                    if (!invite) {
                        throw new errors.NotFoundError({
                            message: i18n.t('errors.api.invites.inviteNotFound')
                        });
                    }

                    if (invite.get('expires') < Date.now()) {
                        throw new errors.NotFoundError({
                            message: i18n.t('errors.api.invites.inviteExpired')
                        });
                    }

                    return models.User.add({
                        email: profile.email,
                        name: profile.email,
                        password: utils.uid(50),
                        roles: [invite.toJSON().role_id],
                        ghost_auth_id: profile.id,
                        ghost_auth_access_token: ghostAuthAccessToken

                    }, options);
                })
                .then(function destroyInvite(_user) {
                    user = _user;
                    return invite.destroy(options);
                })
                .then(function () {
                    return user;
                });
        };

        handleSetup = function handleSetup() {
            return models.User.findOne({slug: 'ghost-owner', status: 'inactive'}, options)
                .then(function fetchedOwner(owner) {
                    if (!owner) {
                        throw new errors.NotFoundError({
                            message: i18n.t('errors.models.user.userNotFound')
                        });
                    }

                    return models.User.edit({
                        email: profile.email,
                        status: 'active',
                        ghost_auth_id: profile.id,
                        ghost_auth_access_token: ghostAuthAccessToken
                    }, _.merge({id: owner.id}, options));
                });
        };

        handleSignIn = function handleSignIn() {
            var user;

            return models.User.findOne({ghost_auth_id: profile.id, status: 'all'}, options)
                .then(function (_user) {
                    user = _user;

                    if (!user) {
                        throw new errors.NotFoundError();
                    }

                    if (user.get('status') === 'inactive') {
                        throw new errors.NoPermissionError({
                            message: 'You were suspended from this blog.'
                        });
                    }

                    return models.User.edit({
                        email: profile.email,
                        ghost_auth_id: profile.id,
                        ghost_auth_access_token: ghostAuthAccessToken
                    }, _.merge({id: user.id}, options));
                })
                .then(function () {
                    return user;
                });
        };

        if (inviteToken) {
            return handleInviteToken()
                .then(function (user) {
                    done(null, user, profile);
                })
                .catch(function (err) {
                    done(err);
                });
        }

        handleSignIn()
            .then(function (user) {
                done(null, user, profile);
            })
            .catch(function (err) {
                if (!(err instanceof errors.NotFoundError)) {
                    return done(err);
                }

                handleSetup()
                    .then(function (user) {
                        done(null, user, profile);
                    })
                    .catch(function (err) {
                        done(err);
                    });
            });
    }
};

module.exports = strategies;
