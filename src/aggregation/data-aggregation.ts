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

import {Attribute, ConstraintType, DataResource, DataAggregationType} from '../model';
import {Constraint, ConstraintData, NumberConstraint, UnknownConstraint} from '../constraint';
import {isNotNullOrUndefined, uniqueValues} from '@lumeer/utils';

export function isValueAggregation(aggregation: DataAggregationType): boolean {
  return !aggregation || ![DataAggregationType.Count, DataAggregationType.Unique].includes(aggregation);
}

export function dataAggregationConstraint(aggregation: DataAggregationType): Constraint {
  if (!isValueAggregation(aggregation)) {
    return new NumberConstraint({});
  }
}

export function dataAggregationsByConstraint(constraint: Constraint): DataAggregationType[] {
  switch (constraint?.type) {
    case ConstraintType.Number:
    case ConstraintType.Percentage:
    case ConstraintType.Duration:
      return [
        DataAggregationType.Sum,
        DataAggregationType.Min,
        DataAggregationType.Max,
        DataAggregationType.Avg,
        DataAggregationType.Median,
        DataAggregationType.Count,
        DataAggregationType.Unique,
      ];
    case ConstraintType.Address:
    case ConstraintType.DateTime:
    case ConstraintType.Coordinates:
    case ConstraintType.Link:
    case ConstraintType.Select:
    case ConstraintType.Text:
    case ConstraintType.Unknown:
    case ConstraintType.View:
    case ConstraintType.User:
      return [
        DataAggregationType.Min,
        DataAggregationType.Max,
        DataAggregationType.Count,
        DataAggregationType.Unique,
        DataAggregationType.Join,
      ];
    default:
      return [];
  }
}

export function aggregateDataResources(
  aggregation: DataAggregationType,
  dataResources: DataResource[],
  attribute: Attribute,
  onlyNumeric?: boolean
): any {
  if (!attribute) {
    return null;
  }

  const values = (dataResources || []).map(resource => resource.data?.[attribute.id]);
  return aggregateDataValues(aggregation, values, attribute.constraint, onlyNumeric);
}

export function aggregateDataValues(
  aggregation: DataAggregationType,
  values: any[],
  constraint?: Constraint,
  onlyNumeric?: boolean,
  constraintData?: ConstraintData
): any {
  const nonNullValues = (values || []).filter(value => isNotNullOrUndefined(value));
  const notNullConstraint = constraint || new UnknownConstraint();
  switch (aggregation) {
    case DataAggregationType.Sum:
      return notNullConstraint.sum(nonNullValues, onlyNumeric);
    case DataAggregationType.Avg:
      return notNullConstraint.avg(nonNullValues, onlyNumeric);
    case DataAggregationType.Min:
      return notNullConstraint.min(nonNullValues, onlyNumeric);
    case DataAggregationType.Max:
      return notNullConstraint.max(nonNullValues, onlyNumeric);
    case DataAggregationType.Median:
      return notNullConstraint.median(nonNullValues, onlyNumeric);
    case DataAggregationType.Count:
      return notNullConstraint.count(values);
    case DataAggregationType.Unique:
      return notNullConstraint.unique(values);
    case DataAggregationType.Join:
      const uniqueFormattedValues = uniqueValues(
        values.map(value => notNullConstraint.createDataValue(value, constraintData).format()).filter(value => !!value)
      );
      return uniqueFormattedValues.join(', ');
    default:
      return notNullConstraint.sum(nonNullValues, onlyNumeric);
  }
}
