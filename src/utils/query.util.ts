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

import {ConditionType, Query, QueryStem, AttributesResource, Collection, LinkType} from '../model';

export function queryIsNotEmptyExceptPagination(query: Query): boolean {
  return (query.stems && query.stems.length > 0) || (query.fulltexts && query.fulltexts.length > 0);
}

export function queryIsEmptyExceptPagination(query: Query): boolean {
  return !queryIsNotEmptyExceptPagination(query);
}

export function queryStemAttributesResourcesOrder(
    stem: QueryStem,
    collections: Collection[],
    linkTypes: LinkType[]
): AttributesResource[] {
  const baseCollection = stem && (collections || []).find(collection => collection?.id === stem.collectionId);
  if (!baseCollection) {
    return [];
  }
  const chain: AttributesResource[] = [{...baseCollection}];
  let previousCollection = baseCollection;
  for (let i = 0; i < (stem.linkTypeIds || []).length; i++) {
    const linkType = (linkTypes || []).find(lt => lt.id === stem.linkTypeIds[i]);
    const otherCollectionId = linkType && getOtherLinkedCollectionId(linkType, previousCollection.id);
    const otherCollection =
        otherCollectionId && (collections || []).find(collection => collection.id === otherCollectionId);

    if (otherCollection && linkType) {
      chain.push({...linkType, collections: [previousCollection, otherCollection]});
      chain.push({...otherCollection});
      previousCollection = otherCollection;
    } else {
      break;
    }
  }

  return chain;
}

function getOtherLinkedCollectionId(linkType: LinkType, collectionId: string): string {
  const collectionIds = linkType?.collectionIds;
  return collectionIds[0] === collectionId ? collectionIds[1] : collectionIds[0];
}
