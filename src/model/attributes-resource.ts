import {Constraint} from '../constraint';

export interface Resource {
    id?: string;
    attributes?: Attribute[];
}

export interface Collection extends Resource {

}

export interface LinkType extends Resource {
    collectionIds: [string, string];
    collections?: [Collection, Collection];
}

export interface Attribute {
    id?: string;
    name: string;
    constraint?: Constraint;
}

export type AttributesResource =
    | Pick<Collection, 'id' | 'attributes'>
    | Pick<LinkType, 'id' | 'attributes' | 'collections'>;

export enum AttributesResourceType {
    Collection = 'collection',
    LinkType = 'linkType',
}
