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

import {Constraint} from '../constraint';
import {deepObjectsEquals} from '@lumeer/utils';
import {AllowedPermissions, Attribute, AttributesResource, AttributesResourceType, Collection, LinkType, QueryAttribute, QueryResource, ResourcesPermissions} from '../model';

export function queryResourcesAreSame(a1: QueryResource, a2: QueryResource): boolean {
  return (
    a1?.resourceId === a2?.resourceId &&
    a1?.resourceIndex === a2?.resourceIndex &&
    a1?.resourceType === a2?.resourceType
  );
}

export function queryAttributesAreSame(a1: QueryAttribute, a2: QueryAttribute): boolean {
  return deepObjectsEquals(cleanQueryAttribute(a1), cleanQueryAttribute(a2));
}

export function cleanQueryAttribute(attribute: QueryAttribute): QueryAttribute {
  return (
    attribute && {
      resourceIndex: attribute.resourceIndex,
      attributeId: attribute.attributeId,
      resourceId: attribute.resourceId,
      resourceType: attribute.resourceType,
    }
  );
}

export function queryAttributePermissions(
  attribute: QueryResource,
  permissions: ResourcesPermissions
): AllowedPermissions {
  if (attribute.resourceType === AttributesResourceType.Collection) {
    return permissions?.collections?.[attribute.resourceId];
  } else if (attribute.resourceType === AttributesResourceType.LinkType) {
    return permissions.linkTypes?.[attribute.resourceId];
  }
  return {};
}

export function findResourceByQueryResource(
  attribute: QueryResource,
  collections: Collection[],
  linkTypes: LinkType[]
): AttributesResource {
  if (attribute?.resourceType === AttributesResourceType.Collection) {
    return (collections || []).find(coll => coll.id === attribute?.resourceId);
  } else if (attribute?.resourceType === AttributesResourceType.LinkType) {
    const linkType = (linkTypes || []).find(lt => lt.id === attribute?.resourceId);
    if (linkType && linkType.collections?.length !== 2) {
      const linkTypeCollections = collections.filter(coll => linkType.collectionIds.includes(coll.id)) as [
        Collection,
        Collection,
      ];
      return {...linkType, collections: linkTypeCollections};
    }
    return linkType;
  }

  return null;
}

export function findAttributeByQueryAttribute(
  attribute: QueryAttribute,
  collections: Collection[],
  linkTypes: LinkType[]
): Attribute {
  const resource = findResourceByQueryResource(attribute, collections, linkTypes);
  return attribute && (resource?.attributes || []).find(attr => attr.id === attribute?.attributeId);
}

export function findConstraintByQueryAttribute(
  attribute: QueryAttribute,
  collections: Collection[],
  linkTypes: LinkType[]
): Constraint {
  return findAttributeByQueryAttribute(attribute, collections, linkTypes)?.constraint;
}
