import {Constraint} from '../constraint';
import {AttributeLock} from './attribute-lock';

export interface Resource {
    id?: string;
    attributes?: Attribute[];
}

export interface Collection extends Resource {
    purpose?: CollectionPurpose;
    color?: string;
    icon?: string;
}

interface CollectionPurpose {
    type: CollectionPurposeType;
    metaData: Partial<CollectionPurposeMetadata>;
}

export enum CollectionPurposeType {
    None = 'None',
    Tasks = 'Tasks',
}

type CollectionPurposeMetadata = TaskPurposeMetadata;

interface TaskPurposeMetadata {
    assigneeAttributeId?: string;
}

export interface LinkType extends Resource {
    collectionIds: [string, string];
    collections?: [Collection, Collection];
}

export interface Attribute {
    id?: string;
    name: string;
    constraint?: Constraint;
    lock?: AttributeLock;
}

export type AttributesResource =
    | Pick<Collection, 'id' | 'attributes'>
    | Pick<LinkType, 'id' | 'attributes' | 'collections'>;

export enum AttributesResourceType {
    Collection = 'collection',
    LinkType = 'linkType',
}
