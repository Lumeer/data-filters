import {Attribute, ConditionType, ConditionValue, ConstraintType} from '../model';
import {Constraint} from './constraint';
import {createRange} from '@lumeer/utils';
import {conditionTypeNumberOfInputs} from '../data-value';

export function initialConditionType(constraint: Constraint): ConditionType {
  return constraint.conditions()[0];
}

export function initialConditionValues(condition: ConditionType, constraint: Constraint): ConditionValue[] {
  const numInputs = conditionTypeNumberOfInputs(condition);
  switch (constraint.type) {
    case ConstraintType.Boolean:
      return createRange(0, numInputs).map(() => ({value: true}));
    default:
      return createRange(0, numInputs).map(() => ({}));
  }
}

export function findAttribute(attributes: Attribute[], attributeId: string): Attribute {
  return attributeId && (attributes || []).find(attr => attr.id === attributeId);
}

export function findAttributeConstraint(attributes: Attribute[], attributeId: string): Constraint {
  return findAttribute(attributes, attributeId)?.constraint;
}