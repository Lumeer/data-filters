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

import {
  AllowedPermissions,
  Attribute,
  AttributeFilter,
  AttributesResourceType,
  Collection,
  DataResource,
  DocumentModel,
  LanguageTag,
  LinkInstance,
  LinkType,
  Query,
  QueryStem,
  Resource,
} from '../model';
import {filterAttributesByFilters, getAttributesResourceType, groupDocumentsByCollection, groupLinkInstancesByLinkTypes, mergeDocuments, mergeLinkInstances, queryIsEmptyExceptPagination, queryStemAttributesResourcesOrder} from '../utils';
import {ConstraintData, createConstraintsInCollections, createConstraintsInLinkTypes} from '../constraint';
import * as momentTimeZone from 'moment-timezone';
import {escapeHtml, isNullOrUndefined, objectsByIdMap, objectValues, removeAccentFromString} from '@lumeer/utils';
import {createDataValuesMap, dataMeetsFilters, dataMeetsFulltexts, dataValuesMeetsFilters} from '../aggregation';

interface FilteredDataResources {
  allDocuments: DocumentModel[];
  pipelineDocuments: DocumentModel[][];
  allLinkInstances: LinkInstance[];
  pipelineLinkInstances: LinkInstance[][];
}

interface FilterPipeline {
  resource: Resource;
  dataResources: DataResource[];
  filters: AttributeFilter[];
  fulltexts: string[];
  attributes: Attribute[];
  permissions: AllowedPermissions;
  documentIds: Set<string>;
}

export function filterDocumentsAndLinksIdsFromJson(json: string): { documentsIds: string[], linkInstancesIds: string[] } {
  const jsObject = JSON.parse(json);
  const documents = jsObject.documents as DocumentModel[];
  const linkInstances = jsObject.linkInstances as LinkInstance[];
  const collections = jsObject.collections as Collection[];
  const linkTypes = jsObject.linkTypes as LinkType[];
  const query = jsObject.query as Query;
  const collectionsPermissions = jsObject.collectionsPermissions as Record<string, AllowedPermissions>;
  const linkTypePermissions = jsObject.linkTypePermissions as Record<string, AllowedPermissions>;
  const constraintData = jsObject.constraintData as ConstraintData;
  const includeChildren = jsObject.includeChildren as boolean;
  const includeNonLinkedDocuments = jsObject.includeNonLinkedDocuments as boolean;
  const language = jsObject.language as LanguageTag;

  const collectionsWithConstraints = createConstraintsInCollections(collections, language);
  const linkTypesWithConstraints = createConstraintsInLinkTypes(linkTypes, language);

  const {documents: filteredDocuments, linkInstances: filteredLinkInstances} = filterDocumentsAndLinksByQuery(documents, collectionsWithConstraints, linkTypesWithConstraints, linkInstances, query, collectionsPermissions, linkTypePermissions, constraintData, includeChildren, includeNonLinkedDocuments);
  return {
    documentsIds: filteredDocuments.map(document => document.id),
    linkInstancesIds: filteredLinkInstances.map(linkInstance => linkInstance.id),
  }
}

export function filterDocumentsAndLinksByQuery(
  documents: DocumentModel[],
  collections: Collection[],
  linkTypes: LinkType[],
  linkInstances: LinkInstance[],
  query: Query,
  collectionsPermissions: Record<string, AllowedPermissions>,
  linkTypePermissions: Record<string, AllowedPermissions>,
  constraintData: ConstraintData,
  includeChildren?: boolean,
  includeNonLinkedDocuments?: boolean,
): { documents: DocumentModel[]; linkInstances: LinkInstance[] } {
  const {uniqueDocuments, uniqueLinkInstances} = filterDocumentsAndLinksDataByQuery(documents, collections, linkTypes, linkInstances, query, collectionsPermissions, linkTypePermissions, constraintData, includeChildren, includeNonLinkedDocuments);
  return {documents: uniqueDocuments, linkInstances: uniqueLinkInstances};
}

export interface DocumentsAndLinksData {
  uniqueDocuments: DocumentModel[];
  uniqueLinkInstances: LinkInstance[];
  dataByStems?: DocumentsAndLinksStemData[];
}

export interface DocumentsAndLinksStemData {
  stem: QueryStem;
  documents: DocumentModel[];
  linkInstances: LinkInstance[];
}

export function filterDocumentsAndLinksDataByQuery(
  documents: DocumentModel[],
  collections: Collection[],
  linkTypes: LinkType[],
  linkInstances: LinkInstance[],
  query: Query,
  collectionsPermissions: Record<string, AllowedPermissions>,
  linkTypePermissions: Record<string, AllowedPermissions>,
  constraintData: ConstraintData,
  includeChildren?: boolean,
  includeNonLinkedDocuments?: boolean,
): DocumentsAndLinksData {
  if (!query || queryIsEmptyExceptPagination(query)) {
    return {uniqueDocuments: paginate(documents, query), uniqueLinkInstances: linkInstances};
  }

  let uniqueDocuments: DocumentModel[] = [];
  let uniqueLinkInstances: LinkInstance[] = [];

  const stems: QueryStem[] =
    (query.stems || []).length > 0
      ? [...query.stems]
      : (collections || []).map(collection => ({collectionId: collection.id}));
  const documentsByCollections = groupDocumentsByCollection(documents);
  const linkInstancesByLinkTypes = groupLinkInstancesByLinkTypes(linkInstances);

  if (constraintData?.timezone) {
    momentTimeZone.tz.setDefault(constraintData.timezone);
  }

  const dataByStems: DocumentsAndLinksStemData[] = [];

  const escapedFulltexts = query.fulltexts?.map(fullText => removeAccentFromString(escapeHtml(fullText)));
  stems.forEach(stem => {
    const {allDocuments, allLinkInstances} = filterDocumentsAndLinksByStem(
      collections,
      documentsByCollections,
      linkTypes,
      linkInstancesByLinkTypes,
      collectionsPermissions,
      linkTypePermissions,
      constraintData,
      stem,
      escapedFulltexts,
      includeChildren,
      includeNonLinkedDocuments,
    );

    dataByStems.push({stem, documents: allDocuments, linkInstances: allLinkInstances});
    uniqueDocuments = mergeDocuments(uniqueDocuments, allDocuments);
    uniqueLinkInstances = mergeLinkInstances(uniqueLinkInstances, allLinkInstances);
  });

  return {uniqueDocuments: paginate(uniqueDocuments, query), uniqueLinkInstances, dataByStems};
}

export function filterDocumentsAndLinksByStem(
  collections: Collection[],
  documentsByCollections: Record<string, DocumentModel[]>,
  linkTypes: LinkType[],
  linkInstancesByLinkTypes: Record<string, LinkInstance[]>,
  collectionsPermissions: Record<string, AllowedPermissions>,
  linkTypePermissions: Record<string, AllowedPermissions>,
  constraintData: ConstraintData,
  stem: QueryStem,
  fulltexts: string[] = [],
  includeChildren?: boolean,
  includeNonLinkedDocuments?: boolean,
): FilteredDataResources {
  const filtered: FilteredDataResources = {
    allDocuments: [],
    pipelineDocuments: [],
    allLinkInstances: [],
    pipelineLinkInstances: [],
  };

  const attributesResources = queryStemAttributesResourcesOrder(stem, collections, linkTypes);
  const pipeline: FilterPipeline[] = attributesResources.map(resource => {
    const type = getAttributesResourceType(resource);
    const filters =
      type === AttributesResourceType.Collection
        ? (stem.filters || []).filter(filter => filter.collectionId === resource.id)
        : (stem.linkFilters || []).filter(filter => filter.linkTypeId === resource.id);
    const dataResources =
      type === AttributesResourceType.Collection
        ? documentsByCollections[resource.id] || []
        : linkInstancesByLinkTypes[resource.id] || [];
    const permissions =
      type === AttributesResourceType.Collection
        ? collectionsPermissions?.[resource.id]
        : linkTypePermissions?.[resource.id];

    const attributes = filterAttributesByFilters(resource.attributes, filters);
    const documentIds = new Set(stem.documentIds || []);

    return {resource, fulltexts, filters, dataResources, permissions, attributes, documentIds};
  });

  if (!pipeline[0]) {
    return filtered;
  }

  const pushedIds = pipeline.map(() => new Set<string>());
  const currentPipeline = pipeline[0];
  const currentPushedIds = pushedIds[0];
  const attributesMap = objectsByIdMap(currentPipeline.resource?.attributes);
  const documentsMap = includeChildren ? documentChildrenMap(currentPipeline.dataResources as DocumentModel[]) : {};
  for (const dataResource of currentPipeline.dataResources) {
    const dataValues = createDataValuesMap(dataResource.data, currentPipeline.attributes, constraintData);
    if (
      dataValuesMeetsFilters(dataValues, currentPipeline.filters, attributesMap, constraintData)
    ) {
      const document = dataResource as DocumentModel;
      if (
        !currentPushedIds.has(document.id) &&
        (checkAndFillDataResources(
          document,
          pipeline,
          filtered,
          constraintData,
          pushedIds,
          1,
          !currentPipeline.fulltexts.length ||
          dataMeetsFulltexts(
            dataResource.data,
            currentPipeline.fulltexts,
            currentPipeline.resource?.attributes,
            constraintData
          )
        ) || pipelineContainsDocumentByIds(currentPipeline, document))
      ) {

        filtered.allDocuments.push(document);
        currentPushedIds.add(document.id);
        pushToMatrix(filtered.pipelineDocuments, document, 0);

        const documentChildren = includeChildren ? getDocumentChildren(document, documentsMap) : [];
        documentChildren.forEach(children => {
          if (!currentPushedIds.has(children.id)) {
            checkAndFillDataResources(children, pipeline, filtered, constraintData, pushedIds,1, !currentPipeline.fulltexts.length ||
              dataMeetsFulltexts(
                children.data,
                currentPipeline.fulltexts,
                currentPipeline.resource?.attributes,
                constraintData
              ));
            filtered.allDocuments.push(children);
            currentPushedIds.add(children.id);
            pushToMatrix(filtered.pipelineDocuments, children, 0);
          }
        })
      }
    }
  }

  if (includeNonLinkedDocuments) {
    for (let i = 2; i < pipeline.length; i+=2) {
      const attributesMap = objectsByIdMap(pipeline[i].resource?.attributes);
      for (const dataResource of pipeline[i].dataResources) {
        const dataValues = createDataValuesMap(dataResource.data, pipeline[i].attributes, constraintData);
        if (!pushedIds[i].has(dataResource.id) && dataValuesMeetsFilters(dataValues, pipeline[i].filters, attributesMap, constraintData) && (!pipeline[i].fulltexts.length || dataMeetsFulltexts(dataResource.data, pipeline[i].fulltexts, pipeline[i].attributes, constraintData))) {
          filtered.allDocuments.push(dataResource as DocumentModel);
          pushedIds[i].add(dataResource.id);
          pushToMatrix(filtered.pipelineDocuments, dataResource, i);
        }
      }
    }
  }

  return filtered;
}

function pushToMatrix(matrix: any[][], value: any, index: number) {
  if (!matrix[index]) {
    matrix[index] = [];
  }
  matrix[index].push(value);
}

function checkAndFillDataResources(
  previousDataResource: DataResource,
  pipeline: FilterPipeline[],
  filtered: FilteredDataResources,
  constraintData: ConstraintData,
  pushedIds: Set<string>[],
  pipelineIndex: number,
  fulltextFound: boolean
): boolean {
  if (pipelineIndex >= pipeline.length) {
    return pipeline[0].documentIds.size > 0 ? false : !pipeline[0].fulltexts.length || fulltextFound;
  }

  const currentPipeline = pipeline[pipelineIndex];
  const type = getAttributesResourceType(currentPipeline.resource);
  if (type === AttributesResourceType.LinkType) {
    const previousDocument = previousDataResource as DocumentModel;
    const linkInstances = pipeline[pipelineIndex].dataResources as LinkInstance[];
    const linkedLinks = linkInstances.filter(
      linkInstance =>
        linkInstance.documentIds.includes(previousDocument.id) &&
        dataMeetsFilters(
          linkInstance,
          linkInstance.data,
          currentPipeline.resource,
          currentPipeline.attributes,
          currentPipeline.filters,
          constraintData
        )
    );
    if (linkedLinks.length === 0 && containsAnyFilterInPipeline(pipeline, pipelineIndex)) {
      return false;
    }

    let someLinkPassed = (!currentPipeline.fulltexts.length || fulltextFound) && linkedLinks.length === 0;
    for (const linkedLink of linkedLinks) {
      if (
        checkAndFillDataResources(
          linkedLink,
          pipeline,
          filtered,
          constraintData,
          pushedIds,
          pipelineIndex + 1,
          fulltextFound ||
          dataMeetsFulltexts(
            linkedLink.data,
            currentPipeline.fulltexts,
            currentPipeline.resource?.attributes,
            constraintData
          )
        ) || pipelineContainsLinkByIds(currentPipeline, linkedLink)
      ) {
        someLinkPassed = true;
        filtered.allLinkInstances.push(linkedLink);
        pushToMatrix(filtered.pipelineLinkInstances, linkedLink, Math.floor(pipelineIndex / 2));
      }
    }
    return someLinkPassed;
  } else {
    const previousLink = previousDataResource as LinkInstance;
    const documents = pipeline[pipelineIndex].dataResources as DocumentModel[];
    const linkedDocuments = documents.filter(
      document =>
        previousLink.documentIds.includes(document.id) &&
        dataMeetsFilters(
          document,
          document.data,
          currentPipeline.resource,
          currentPipeline.attributes,
          currentPipeline.filters,
          constraintData
        )
    );
    if (linkedDocuments.length === 0 && containsAnyFilterInPipeline(pipeline, pipelineIndex)) {
      return false;
    }

    let someDocumentPassed = (!currentPipeline.fulltexts.length || fulltextFound) && linkedDocuments.length === 0;
    for (const linkedDocument of linkedDocuments) {
      if (
        checkAndFillDataResources(
          linkedDocument,
          pipeline,
          filtered,
          constraintData,
          pushedIds,
          pipelineIndex + 1,
          fulltextFound ||
          dataMeetsFulltexts(
            linkedDocument.data,
            currentPipeline.fulltexts,
            currentPipeline.resource?.attributes,
            constraintData
          )
        ) || pipelineContainsDocumentByIds(currentPipeline, linkedDocument)
      ) {
        someDocumentPassed = true;
        if (!pushedIds[pipelineIndex].has(linkedDocument.id)) {
          filtered.allDocuments.push(linkedDocument)
          pushedIds[pipelineIndex].add(linkedDocument.id)
        }
        pushToMatrix(filtered.pipelineDocuments, linkedDocument, Math.floor(pipelineIndex / 2));
      }
    }
    return someDocumentPassed;
  }
}

function pipelineContainsDocumentByIds(pipeline: FilterPipeline, document: DocumentModel): boolean {
  return pipeline.documentIds.size > 0 && pipeline.documentIds.has(document.id);
}

function pipelineContainsLinkByIds(pipeline: FilterPipeline, linkInstance: LinkInstance): boolean {
  return pipeline.documentIds.size > 0 && (linkInstance.documentIds?.length === 2 && pipeline.documentIds.has(linkInstance.documentIds[0]) || pipeline.documentIds.has(linkInstance.documentIds[1]));
}

function containsAnyFilterInPipeline(pipeline: FilterPipeline[], fromIndex: number): boolean {
  return pipeline.slice(fromIndex, pipeline.length).some(pipe => (pipe.filters || []).length > 0);
}

function getDocumentChildren(document: DocumentModel, documentsMap: Record<string, DocumentModel[]>): DocumentModel[] {
  const documentChildrenMap: Record<string, DocumentModel> = {};

  const documentsQueue = [document];
  while (documentsQueue.length) {
    const currentDocument = documentsQueue.splice(0, 1)[0];
    if (currentDocument && !documentChildrenMap[currentDocument.id]) {
      documentChildrenMap[currentDocument.id] = currentDocument;

      const childDocuments = documentsMap?.[currentDocument.id] || [];
      documentsQueue.push(...childDocuments);
    }
  }

  delete documentChildrenMap[document.id];

  return objectValues(documentChildrenMap);
}

export function someDocumentMeetFulltexts(
  documents: DocumentModel[],
  collection: Collection,
  fulltexts: string[],
  constraintData: ConstraintData
): boolean {
  for (const document of documents) {
    if (dataMeetsFulltexts(document.data, fulltexts, collection?.attributes, constraintData)) {
      return true;
    }
  }
  return false;
}


function paginate(documents: DocumentModel[], query: Query) {
  if (!query || isNullOrUndefined(query.page) || isNullOrUndefined(query.pageSize) || (!query.page && !query.pageSize)) {
    return documents;
  }

  return [...documents].slice(query.page * query.pageSize, (query.page + 1) * query.pageSize);
}

function documentChildrenMap(documents: DocumentModel[]): Record<string, DocumentModel[]> {
  return (documents || []).reduce((map, document) => {
    if (document.metaData?.parentId) {
      if (!map[document.metaData.parentId]) {
        map[document.metaData.parentId] = [];
      }
      map[document.metaData.parentId].push(document);
    }

    return map;
  }, {});
}
