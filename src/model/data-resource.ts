export interface DataResource {
    id?: string;
    data: Record<string, any>;
    createdBy?: string;
}

export interface DocumentModel extends DataResource {
    collectionId: string;
    metaData?: DocumentMetaData;
}

export interface DocumentMetaData {
    parentId?: string;
}

export interface LinkInstance extends DataResource {
    linkTypeId: string;
    documentIds: [string, string];
}
