import {Collection, View} from '../model';

export function getViewColor(view: View, collectionsMap: Record<string, Collection>): string {
  return view?.color || defaultViewColorFromQuery(view, collectionsMap);
}

export function defaultViewColorFromQuery(view: View, collectionsMap: Record<string, Collection>): string {
  const firstStemCollectionId = view?.query?.stems?.[0]?.collectionId;
  return (firstStemCollectionId && collectionsMap?.[firstStemCollectionId]?.color) || '';
}