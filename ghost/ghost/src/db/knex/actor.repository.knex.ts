import {Inject} from '@nestjs/common';
import ObjectID from 'bson-objectid';
import {ActorRepository} from '../../core/activitypub/actor.repository';
import {Actor} from '../../core/activitypub/actor.entity';
import {SettingsCache} from '../../common/types/settings-cache.type';
import {URI} from '../../core/activitypub/uri.object';
import {Activity} from '../../core/activitypub/activity.entity';
import {ActivityPub} from '../../core/activitypub/types';

interface DomainEvents {
    dispatch(event: unknown): void
}

export class ActorRepositoryKnex implements ActorRepository {
    private readonly domainEvents: DomainEvents;
    private readonly settingsCache: SettingsCache;

    #defaultActor: Actor;

    constructor(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        @Inject('knex') private readonly knex: any,
        @Inject('SettingsCache') settingsCache: SettingsCache,
        @Inject('DomainEvents') domainEvents: DomainEvents
    ) {
        // TODO: move this to fixtures
        this.#defaultActor = Actor.create({
            id: ObjectID.createFromHexString('deadbeefdeadbeefdeadbeef'),
            username: 'index',
            displayName: settingsCache.get('title'),
            publicKey: settingsCache.get('ghost_public_key'),
            privateKey: settingsCache.get('ghost_private_key'),
            following: [],
            internal: true
        });

        this.domainEvents = domainEvents;
        this.settingsCache = settingsCache;

        this.save(this.#defaultActor);
    }

    private async dbToActor(model: ActivityPub.ActivityPubActorDBData) {
        const inbox = model.data.inbox ? model.data.inbox.map(activity => Activity.create(activity)) : [];
        const outbox = model.data.outbox ? model.data.outbox.map(activity => Activity.create(activity)) : [];
        const featured = model?.data?.featured?.length ? model.data.featured.map(feature => ({
            id: new URI(feature.id)
        })) : [];
        const following = model?.data?.following?.length ? model.data.following.map(follows => ({
            id: new URI(follows.id),
            username: follows.username || undefined
        })) : [];
        const followers = model?.data?.followers?.length ? model.data.followers.map(follower => ({
            id: new URI(follower.id)
        })) : [];

        return Actor.create({
            id: ObjectID.createFromHexString(model.id),
            username: model.data.username,
            displayName: model.data?.displayName ?? undefined,
            publicKey: this.settingsCache.get('ghost_public_key'),
            privateKey: this.settingsCache.get('ghost_private_key'),
            following,
            followers,
            featured,
            inbox,
            outbox,
            internal: model.internal,
            createdAt: new Date(model.created_at),
            updatedAt: new Date(model.updated_at)
        });
    }

    private async getOneByUsername(username: string) {
        const row = await this.knex('prototype_activitypub')
            .where('type', 'Person')
            .whereJsonObject('data', {username})
            .first();

        if (!row) {
            return null;
        }
        return await this.dbToActor(row);
    }

    private async getOneById(id: ObjectID) {
        const row = await this.knex('prototype_activitypub')
            .where('type', 'Person')
            .where('id', id.toHexString())
            .first();

        if (!row) {
            return null;
        }
        return await this.dbToActor(row);
    }

    async getOne(identifier: string | ObjectID) {
        if (identifier instanceof ObjectID) {
            return await this.getOneById(identifier);
        } else {
            return await this.getOneByUsername(identifier);
        }
    }

    async save(actor: Actor) {
        const inbox = actor.inbox instanceof Activity ? actor.inbox.map(activity => activity.getJSON()) : actor.inbox;
        const outbox = actor.outbox instanceof Activity ? actor.outbox.map(activity => activity.getJSON()) : actor.outbox;

        const data = {
            username: actor.username,
            displayName: actor.displayName,
            following: actor.following,
            followers: actor.followers,
            features: actor.featured,
            inbox,
            outbox
        };

        const id = actor.id;
        const url = actor.actorId.toString();
        const existingActor = await this.getOne(id || actor?.username);

        if (!existingActor) {
            await this.knex('prototype_activitypub')
                .insert({
                    id: id.toHexString(),
                    type: 'Person',
                    url,
                    data: JSON.stringify(data),
                    created_at: actor.createdAt || new Date(),
                    internal: actor.internal || false
                });
        } else {
            // TODO: ensure we don't accidentally overwrite data
            await this.knex('prototype_activitypub')
                .where('id', id.toHexString())
                .update({
                    data: JSON.stringify(data),
                    updated_at: actor.updatedAt || new Date()
                });
        }
        Actor.getActivitiesToSave(actor, (/* activities */) => {
            // Persist activities
        });
        Actor.getEventsToDispatch(actor, (events) => {
            for (const event of events) {
                this.domainEvents.dispatch(event);
            }
        });
    }
};