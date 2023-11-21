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

import {ConstraintType, Attribute, DocumentModel, LinkInstance, AttributeFilter, AttributeLock} from '../model';
import {objectsByIdMap, objectValues} from '@lumeer/utils';

export function groupDocumentsByCollection(documents: DocumentModel[]): Record<string, DocumentModel[]> {
    return (documents || []).reduce((map, document) => {
        if (!map[document.collectionId]) {
            map[document.collectionId] = [];
        }
        map[document.collectionId].push(document);
        return map;
    }, {});
}

export function mergeDocuments(documentsA: DocumentModel[], documentsB: DocumentModel[]): DocumentModel[] {
    if (documentsA.length === 0 || documentsB.length === 0) {
        return documentsA.length > 0 ? documentsA : documentsB;
    }
    const documentsAIds = new Set(documentsA.map(collection => collection.id));
    const documentsBToAdd = documentsB.filter(collection => !documentsAIds.has(collection.id));
    return documentsA.concat(documentsBToAdd);
}


export function groupLinkInstancesByLinkTypes(linkInstances: LinkInstance[]): Record<string, LinkInstance[]> {
    return (linkInstances || []).reduce((map, document) => {
        if (!map[document.linkTypeId]) {
            map[document.linkTypeId] = [];
        }
        map[document.linkTypeId].push(document);
        return map;
    }, {});
}

export function mergeLinkInstances(linkInstancesA: LinkInstance[], linkInstancesB: LinkInstance[]): LinkInstance[] {
    if (linkInstancesA.length === 0 || linkInstancesB.length === 0) {
        return linkInstancesA.length > 0 ? linkInstancesA : linkInstancesB;
    }
    const documentsAIds = new Set(linkInstancesA.map(collection => collection.id));
    const documentsBToAdd = linkInstancesB.filter(collection => !documentsAIds.has(collection.id));
    return linkInstancesA.concat(documentsBToAdd);
}

export function filterAttributesByFilters(attributes: Attribute[], filters: AttributeFilter[]): Attribute[] {
    const attributesMap = objectsByIdMap(attributes);
    return uniqueAttributes(
        (filters || []).reduce((attrs, filter) => {
            const attribute = attributesMap[filter.attributeId];
            if (attribute) {
                attrs.push(attribute);
            }
            if (attribute?.constraint?.type === ConstraintType.Action) {
                attrs.push(
                    ...collectAttributeLockFilters(attribute.lock)
                        .filter(configFilter => !!attributesMap[configFilter.attributeId])
                        .map(configFilter => attributesMap[configFilter.attributeId])
                );
            }
            return attrs;
        }, [])
    );
}

export function collectAttributeLockFilters(lock: AttributeLock): AttributeFilter[] {
    return (lock?.exceptionGroups || []).reduce((filters, group) => {
        filters.push(...(group.equation?.equations?.map(eq => eq.filter) || []));
        return filters;
    }, []);
}

export function uniqueAttributes(attributes: Attribute[]): Attribute[] {
    return objectValues(objectsByIdMap(attributes));
}
