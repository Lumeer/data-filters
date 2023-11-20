import {Constraint, ConstraintData} from '../constraint';
import {Attribute, AttributeLock, AttributesResource, DataResource} from '../model';
import {AttributeLockFiltersStats, computeAttributeLockStats} from '../filters';

export function isAttributeEditable(
  resource: AttributesResource,
  dataResource: DataResource,
  attribute: Attribute,
  constraintData: ConstraintData
): boolean {
  const stats = computeAttributeLockStats(dataResource, resource, attribute?.lock, constraintData);
  return isAttributeLockEnabledByLockStats(attribute?.lock, stats);
}

export function isAttributeLockEnabledByLockStats(lock: AttributeLock, stats: AttributeLockFiltersStats): boolean {
  if (lock?.locked) {
    return !!stats?.satisfy;
  }
  return !stats?.satisfy;
}

export function findAttribute(attributes: Attribute[], attributeId: string): Attribute {
  return attributeId && (attributes || []).find(attr => attr.id === attributeId);
}

export function findAttributeConstraint(attributes: Attribute[], attributeId: string): Constraint {
  return findAttribute(attributes, attributeId)?.constraint;
}