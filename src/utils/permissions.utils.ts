/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {AllowedPermissions, ActionRole, DataResource, AttributesResource, User, DocumentModel, Collection, AttributesResourceType, LinkType, LinkInstance, CollectionPurposeType, ConstraintType} from '../model';
import {getAttributesResourceType} from './data-resource.utils';
import {isArray} from './array.utils';
import {isNotNullOrUndefined} from './common.utils';
import {ConstraintData, UserConstraint} from '../constraint';

export function hasRoleByPermissions(role: ActionRole, dataResource: DataResource, resource: AttributesResource, permissions: AllowedPermissions, user: User, constraintData: ConstraintData): boolean {
    switch (role) {
        case ActionRole.Read:
            return userCanReadDataResource(dataResource, resource, permissions, user, constraintData);
        case ActionRole.Write:
            return userCanEditDataResource(dataResource, resource, permissions, user, constraintData);
        default:
            return false;
    }
}

export function userCanReadDataResource(
  dataResource: DataResource,
  resource: AttributesResource,
  permissions: AllowedPermissions,
  user: User,
  constraintData: ConstraintData
): boolean {
    const resourceType = getAttributesResourceType(resource);
    if (resourceType === AttributesResourceType.Collection) {
        return userCanReadDocument(dataResource as DocumentModel, resource, permissions, user, constraintData);
    } else if (resourceType === AttributesResourceType.LinkType) {
        return userCanReadLinkInstance(dataResource as LinkInstance, resource as LinkType, permissions, user);
    }
    return false;
}

export function userCanEditDataResource(
  dataResource: DataResource,
  resource: AttributesResource,
  permissions: AllowedPermissions,
  user: User,
  constraintData: ConstraintData
): boolean {
    const resourceType = getAttributesResourceType(resource);
    if (resourceType === AttributesResourceType.Collection) {
        return userCanEditDocument(dataResource as DocumentModel, resource, permissions, user, constraintData);
    } else if (resourceType === AttributesResourceType.LinkType) {
        return userCanEditLinkInstance(dataResource as LinkInstance, resource as LinkType, permissions, user);
    }
    return false;
}

export function userCanDeleteDataResource(
  dataResource: DataResource,
  resource: AttributesResource,
  permissions: AllowedPermissions,
  user: User,
  constraintData: ConstraintData
): boolean {
    const resourceType = getAttributesResourceType(resource);
    if (resourceType === AttributesResourceType.Collection) {
        return userCanDeleteDocument(dataResource as DocumentModel, resource, permissions, user, constraintData);
    } else if (resourceType === AttributesResourceType.LinkType) {
        return userCanDeleteLinkInstance(dataResource as LinkInstance, resource as LinkType, permissions, user);
    }
    return false;
}

export function userCanReadDocument(
  document: DocumentModel,
  collection: Collection,
  permissions: AllowedPermissions,
  user: User,
  constraintData: ConstraintData
): boolean {
    return (
      permissions?.rolesWithView?.DataRead ||
      (permissions?.rolesWithView?.DataContribute && isDocumentOwner(document, collection, user)) ||
      isDocumentOwnerByPurpose(document, collection, user, constraintData)
    );
}

export function userCanEditDocument(
  document: DocumentModel,
  collection: Collection,
  permissions: AllowedPermissions,
  user: User,
  constraintData: ConstraintData
): boolean {
    return (
      permissions?.rolesWithView?.DataWrite ||
      (permissions?.rolesWithView?.DataContribute && isDocumentOwner(document, collection, user)) ||
      isDocumentOwnerByPurpose(document, collection, user, constraintData)
    );
}

export function userCanDeleteDocument(
  document: DocumentModel,
  collection: Collection,
  permissions: AllowedPermissions,
  user: User,
  constraintData: ConstraintData
): boolean {
    return (
      permissions?.rolesWithView?.DataDelete ||
      (permissions?.rolesWithView?.DataContribute && isDocumentOwner(document, collection, user)) ||
      isDocumentOwnerByPurpose(document, collection, user, constraintData)
    );
}

function isDocumentOwner(document: DocumentModel, collection: Collection, user: User): boolean {
    return user && document?.createdBy == user.id;
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

export function userCanDeleteLinkInstance(
  linkInstance: LinkInstance,
  linkType: LinkType,
  permissions: AllowedPermissions,
  user: User
): boolean {
    return (
      permissions?.rolesWithView?.DataDelete ||
      (permissions?.rolesWithView?.DataContribute && isLinkOwner(linkInstance, linkType, user))
    );
}

function isDocumentOwnerByPurpose(
  document: DocumentModel,
  collection: Collection,
  user: User,
  constraintData: ConstraintData
): boolean {
    if (!document || !collection || !user) {
        return false;
    }
    if (collection.purpose?.type === CollectionPurposeType.Tasks) {
        const assigneeAttributeId = collection.purpose?.metaData?.assigneeAttributeId;
        const assigneeAttribute = (collection.attributes || []).find(attr => attr.id === assigneeAttributeId);
        if (assigneeAttribute) {
            const assigneeData = document?.data?.[assigneeAttribute.id];
            if (assigneeAttribute.constraint?.type === ConstraintType.User) {
                return checkAssigneeUserConstraint(
                  assigneeData,
                  assigneeAttribute.constraint as UserConstraint,
                  user,
                  constraintData
                );
            }
            return checkAssigneeOtherConstraint(assigneeData, user);
        }
    }
    return false;
}

function checkAssigneeOtherConstraint(value: any, user: User): boolean {
    const assignees = (isArray(value) ? value : [value]).filter(value => isNotNullOrUndefined(value));
    return assignees.includes(user.email);
}

function checkAssigneeUserConstraint(
  value: any,
  constraint: UserConstraint,
  user: User,
  constraintData: ConstraintData
): boolean {
    const dataValue = constraint.createDataValue(value, constraintData);
    return dataValue.allUsersIds.includes(user.id);
}

function isLinkOwner(linkInstance: LinkInstance, linkType: LinkType, user: User): boolean {
    return user && linkInstance?.createdBy == user.id;
}

