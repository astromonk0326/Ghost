import Ember from 'ember';
import AuthenticatedRoute from 'ghost/routes/authenticated';
import CurrentUserSettings from 'ghost/mixins/current-user-settings';
import ShortcutsRoute from 'ghost/mixins/shortcuts-route';
import PaginationRoute from 'ghost/mixins/pagination-route';

export default AuthenticatedRoute.extend(CurrentUserSettings, PaginationRoute, ShortcutsRoute, {
  model() {
    return {
        clients: [{
            "slug": "ghost-admin",
            "type": "ua",
            "id": 1,
            "uuid": "c712cbcd-326d-4f85-a8e0-15d74188c56f",
            "name": "Ghost Admin",
            "secret": "bf9b141079f9",
            "redirection_uri": null,
            "logo": null,
            "status": "enabled",
            "description": null,
            "created_at": "2015-12-07T17:55:06.861Z",
            "created_by": 1,
            "updated_at": "2015-12-07T17:55:06.861Z",
            "updated_by": 1
            },
            {
            "slug":"ghost-frontend",
            "type":"ua",
            "id":2,
            "uuid":"0be92c46-452e-4d2c-8e05-4c6972a57ab4",
            "name":"Ghost Frontend","secret":"2f5c4f62913e",
            "redirection_uri":null,
            "logo":null,
            "status":"enabled",
            "description":null,
            "created_at":"2015-12-07T17:55:06.861Z",
            "created_by":1,
            "updated_at":"2015-12-07T17:55:06.861Z",
            "updated_by":1
          }
        ]};
      }
});
