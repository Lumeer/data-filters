import {AllowedPermissions, ActionRole, DataResource, AttributesResource, User, DocumentModel, Collection, AttributesResourceType, LinkType, LinkInstance, CollectionPurposeType} from '../model';
import {getAttributesResourceType} from './data-resource.utils';
import {isArray} from './array.utils';
import {isNotNullOrUndefined} from './common.utils';

export function hasRoleByPermissions(role: ActionRole, dataResource: DataResource, resource: AttributesResource, permissions: AllowedPermissions, user: User): boolean {
    switch (role) {
        case ActionRole.Read:
            return userCanReadDataResource(dataResource, resource, permissions, user);
        case ActionRole.Write:
            return userCanEditDataResource(dataResource, resource, permissions, user);
        default:
            return false;
    }
}

function userCanReadDataResource(
    dataResource: DataResource,
    resource: AttributesResource,
    permissions: AllowedPermissions,
    user: User
): boolean {
    const resourceType = getAttributesResourceType(resource);
    if (resourceType === AttributesResourceType.Collection) {
        return userCanReadDocument(dataResource as DocumentModel, resource, permissions, user);
    } else if (resourceType === AttributesResourceType.LinkType) {
        return userCanReadLinkInstance(dataResource as LinkInstance, resource as LinkType, permissions, user);
    }
    return false;
}

function userCanEditDataResource(
    dataResource: DataResource,
    resource: AttributesResource,
    permissions: AllowedPermissions,
    user: User
): boolean {
    const resourceType = getAttributesResourceType(resource);
    if (resourceType === AttributesResourceType.Collection) {
        return userCanEditDocument(dataResource as DocumentModel, resource, permissions, user);
    } else if (resourceType === AttributesResourceType.LinkType) {
        return userCanEditLinkInstance(dataResource as LinkInstance, resource as LinkType, permissions, user);
    }
    return false;
}

export function userCanReadDocument(
    document: DocumentModel,
    collection: Collection,
    permissions: AllowedPermissions,
    user: User
): boolean {
    return (
        permissions?.rolesWithView?.DataRead ||
        (permissions?.rolesWithView?.DataContribute && isDocumentOwner(document, collection, user)) ||
        isDocumentOwnerByPurpose(document, collection, user)
    );
}

export function userCanEditDocument(
    document: DocumentModel,
    collection: Collection,
    permissions: AllowedPermissions,
    user: User
): boolean {
    return (
        permissions?.rolesWithView?.DataWrite ||
        (permissions?.rolesWithView?.DataContribute && isDocumentOwner(document, collection, user)) ||
        isDocumentOwnerByPurpose(document, collection, user)
    );
}

function isDocumentOwner(document: DocumentModel, collection: Collection, user: User): boolean {
    return user && document?.createdBy == user.id;
}

function isDocumentOwnerByPurpose(document: DocumentModel, collection: Collection, user: User): boolean {
    if (!document || !collection || !user) {
        return false;
    }
    if (collection.purpose?.type === CollectionPurposeType.Tasks) {
        const assigneeAttributeId = collection.purpose?.metaData?.assigneeAttributeId;
        const assigneeAttribute = (collection.attributes || []).find(attr => attr.id === assigneeAttributeId);
        if (assigneeAttribute) {
            const assigneeData = document?.data?.[assigneeAttribute.id];
            const assignees = (isArray(assigneeData) ? assigneeData : [assigneeData]).filter(value =>
                isNotNullOrUndefined(value)
            );
            return assignees.includes(user.email);
        }
    }
    return false;
}

export function userCanReadLinkInstance(
    linkInstance: LinkInstance,
    linkType: LinkType,
    permissions: AllowedPermissions,
    user: User
): boolean {
    return (
        permissions?.rolesWithView?.DataRead ||
        (permissions?.rolesWithView?.DataContribute && isLinkOwner(linkInstance, linkType, user))
    );
}

export function userCanEditLinkInstance(
    linkInstance: LinkInstance,
    linkType: LinkType,
    permissions: AllowedPermissions,
    user: User
): boolean {
    return (
        permissions?.rolesWithView?.DataWrite ||
        (permissions?.rolesWithView?.DataContribute && isLinkOwner(linkInstance, linkType, user))
    );
}

function isLinkOwner(linkInstance: LinkInstance, linkType: LinkType, user: User): boolean {
    return user && linkInstance?.createdBy == user.id;
}

