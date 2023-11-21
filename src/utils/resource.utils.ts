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
import {objectsByIdMap} from '@lumeer/utils';
import {Attribute, AttributesResource, AttributesResourceType, LinkType} from '../model';

export function generateCorrelationId(): string {
  return Date.now() + ':' + Math.random();
}

export function generateId(): string {
  // the trailing 'a' makes sure we never end up with a pure numeric string that could be parsed on backed as a number
  // because it does not fit into any basic Java type
  return Date.now().toString() + Math.floor(0x100000000000 + Math.random() * 0xefffffffff).toString(16) + 'a';
}

export function getAttributesResourceType(attributesResource: AttributesResource): AttributesResourceType {
  if (<LinkType>attributesResource && (<LinkType>attributesResource).collectionIds) {
    return AttributesResourceType.LinkType;
  }
  return AttributesResourceType.Collection;
}

export function attributesResourcesAreSame(a1: AttributesResource, a2: AttributesResource): boolean {
  return a1 && a2 && a1.id === a2.id && getAttributesResourceType(a1) === getAttributesResourceType(a2);
}

export function attributesResourcesAttributesMap(
  resources: AttributesResource[]
): Record<string, Record<string, Attribute>> {
  return (resources || []).reduce<Record<string, Record<string, Attribute>>>(
    (map, resource) => ({...map, [resource.id]: objectsByIdMap(resource.attributes)}),
    {}
  );
}
