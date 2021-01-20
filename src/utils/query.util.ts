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


import {ConditionType, ConditionValue} from '../data/attribute-filter';
import {ConstraintType} from '../data/constraint';
import {createRange} from './array.utils';
import {Query} from '../model/query';
import {isNullOrUndefined} from './common.utils';

export function areConditionValuesDefined(
  condition: ConditionType,
  conditionValues: ConditionValue[],
  constraintType: ConstraintType
): boolean {
  return (
    condition &&
    createRange(0, conditionNumInputs(condition)).every(
      index =>
        conditionValues[index] &&
        (conditionValues[index].type || conditionValues[index].value || constraintType === ConstraintType.Boolean)
    )
  );
}

export function conditionNumInputs(condition: ConditionType): number {
  switch (condition) {
    case ConditionType.IsEmpty:
    case ConditionType.NotEmpty:
    case ConditionType.Enabled:
    case ConditionType.Disabled:
      return 0;
    case ConditionType.Between:
    case ConditionType.NotBetween:
      return 2;
    default:
      return 1;
  }
}

export function queryIsNotEmpty(query: Query): boolean {
  return (
    (query.stems && query.stems.length > 0) ||
    (query.fulltexts && query.fulltexts.length > 0) ||
    !isNullOrUndefined(query.page) ||
    !!query.pageSize
  );
}

export function queryIsEmpty(query: Query): boolean {
  return !queryIsNotEmpty(query);
}

export function queryIsNotEmptyExceptPagination(query: Query): boolean {
  return (query.stems && query.stems.length > 0) || (query.fulltexts && query.fulltexts.length > 0);
}

export function queryIsEmptyExceptPagination(query: Query): boolean {
  return !queryIsNotEmptyExceptPagination(query);
}

export function isSingleCollectionQuery(query: Query): boolean {
  return query && query.stems && query.stems.length === 1;
}

export function isAnyCollectionQuery(query: Query): boolean {
  return query && query.stems && query.stems.length > 0;
}
