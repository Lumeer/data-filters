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

import {DurationDataValue} from '../data-value/duration.data-value';
import {ConstraintData, ConstraintType} from '../data/constraint';
import {DurationConstraintConfig} from '../data/constraint-config';
import {Constraint} from './index';
import {
  avgNumericValues,
  countValues,
  maxInNumericValues,
  medianInNumericValues,
  minInNumericValues,
  sumNumericValues,
  uniqueValuesCount,
} from './aggregation';
import {ConditionType} from '../data/attribute-filter';

export class DurationConstraint implements Constraint {
  public readonly type = ConstraintType.Duration;
  public readonly isTextRepresentation = true;
  public readonly allowEditFunction = true;

  constructor(public readonly config: DurationConstraintConfig) {}

  public createDataValue(value: any, constraintData: ConstraintData): DurationDataValue {
    return new DurationDataValue(value, this.config, constraintData);
  }

  public createInputDataValue(inputValue: string, value: any, constraintData: ConstraintData): DurationDataValue {
    return new DurationDataValue(value, this.config, constraintData, inputValue);
  }

  public conditions(): ConditionType[] {
    return [
      ConditionType.Equals,
      ConditionType.NotEquals,
      ConditionType.GreaterThan,
      ConditionType.LowerThan,
      ConditionType.GreaterThanEquals,
      ConditionType.LowerThanEquals,
      ConditionType.Between,
      ConditionType.NotBetween,
      ConditionType.IsEmpty,
      ConditionType.NotEmpty,
    ];
  }

  public avg(values: any[], onlyNumeric?: boolean): any {
    return avgNumericValues(values, onlyNumeric);
  }

  public max(values: any[], onlyNumeric?: boolean): any {
    return maxInNumericValues(values, onlyNumeric);
  }

  public median(values: any[], onlyNumeric?: boolean): any {
    return medianInNumericValues(values, onlyNumeric);
  }

  public min(values: any[], onlyNumeric?: boolean): any {
    return minInNumericValues(values, onlyNumeric);
  }

  public sum(values: any[], onlyNumeric?: boolean): any {
    return sumNumericValues(values, onlyNumeric);
  }

  public unique(values: any[]): any {
    return uniqueValuesCount(values);
  }

  public count(values: any[]): number {
    return countValues(values);
  }
}