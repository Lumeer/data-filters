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

import Big from 'big.js';

import {NumericDataValue} from './data-value';
import {
  compareBigNumbers,
  convertBigToNumberSafely,
  isNumeric,
  toNumber,
  escapeHtml,
  isNotNullOrUndefined,
  unescapeHtml,
  convertToBig,
  formatUnknownDataValue,
  dataValuesMeetConditionByNumber,
  valueByConditionNumber,
  valueMeetFulltexts,
  createDurationUnitsCountsMap,
  formatDurationDataValue,
  getDurationSaveValue,
  getDurationUnitToMillisMap,
  isDurationDataValueValid,
  sortedDurationUnits,
  roundBigNumber
} from '../utils';
import {ConditionType, ConditionValue, DurationConstraintConfig, DurationUnit} from '../model';
import {ConstraintData, DurationUnitsMap} from '../constraint';

export class DurationDataValue implements NumericDataValue {
  public readonly number: Big;
  public readonly unitsCountMap: Record<DurationUnit, number>;
  private readonly roundedNumber: Big;
  private readonly parsedValue: string;

  constructor(
    public readonly value: any,
    public readonly config: DurationConstraintConfig,
    public readonly constraintData: ConstraintData,
    public readonly inputValue?: string
  ) {
    const durationUnitsMap = this.constraintData?.durationUnitsMap;
    this.parsedValue = this.inputValue ? parseInputValue(this.inputValue) : value;
    if (isDurationDataValueValid(this.parsedValue, durationUnitsMap)) {
      const saveValue = getDurationSaveValue(this.parsedValue, this.config, durationUnitsMap);
      this.number = convertToBig(saveValue);
      this.roundedNumber = roundBigNumber(this.number, config?.decimalPlaces);
      this.unitsCountMap = createDurationUnitsCountsMap(saveValue, this.config);
    }
  }

  public format(overrideConfig?: Partial<DurationConstraintConfig>): string {
    return this.formatWithUnitsMap(this.constraintData?.durationUnitsMap, overrideConfig);
  }

  private formatToNativeLocale(): string {
    return this.formatWithUnitsMap();
  }

  private formatWithUnitsMap(durationUnitsMap?: DurationUnitsMap, overrideConfig?: Partial<DurationConstraintConfig>) {
    if (isNotNullOrUndefined(this.inputValue)) {
      return this.inputValue;
    }

    if (!this.number) {
      return formatUnknownDataValue(this.value);
    }

    return formatDurationDataValue(this.value, this.config, durationUnitsMap, overrideConfig);
  }

  public preview(overrideConfig?: Partial<DurationConstraintConfig>): string {
    return this.format(overrideConfig);
  }

  public title(overrideConfig?: Partial<DurationConstraintConfig>): string {
    return unescapeHtml(this.format(overrideConfig));
  }

  public editValue(): string {
    return unescapeHtml(this.format());
  }

  public serialize(): any {
    if (this.number) {
      return convertBigToNumberSafely(this.number, 0);
    }

    return escapeHtml(formatUnknownDataValue(this.value));
  }

  public isValid(ignoreConfig?: boolean): boolean {
    if (isNotNullOrUndefined(this.inputValue)) {
      return this.copy(this.inputValue).isValid(ignoreConfig);
    }
    return !!this.number || !this.value;
  }

  public increment(): DurationDataValue {
    return this.addToSmallestUnit();
  }

  private addToSmallestUnit(multiplier: 1 | -1 = 1): DurationDataValue {
    const one = new Big(1);
    if (this.number) {
      const formatted = this.formatToNativeLocale();
      const unitsMap = getDurationUnitToMillisMap(this.config);
      for (let i = sortedDurationUnits.length - 1; i >= 0; i--) {
        if (formatted.includes(sortedDurationUnits[i])) {
          const millis = unitsMap[sortedDurationUnits[i]] || 1;
          if (this.number.div(new Big(millis)).gte(one)) {
            return this.copy(this.number.add(millis * multiplier).toFixed());
          }
        }
      }
    }
    return this.copy();
  }

  public decrement(): DurationDataValue {
    return this.addToSmallestUnit(-1);
  }

  public compareTo(otherValue: DurationDataValue): number {
    return compareBigNumbers(this.roundedNumber, otherValue.roundedNumber);
  }

  public copy(newValue?: any): DurationDataValue {
    const value = newValue !== undefined ? newValue : this.value;
    return new DurationDataValue(value, this.config, this.constraintData);
  }

  public parseInput(inputValue: string): DurationDataValue {
    return new DurationDataValue(inputValue, this.config, this.constraintData, inputValue);
  }

  public meetCondition(condition: ConditionType, values: ConditionValue[]): boolean {
    const dataValues = (values || []).map(
        value => new DurationDataValue(value.value, this.config, this.constraintData)
    );
    const otherBigNumbers = dataValues.map(value => value.roundedNumber);
    const otherValues = dataValues.map(value => value.parsedValue);

    return dataValuesMeetConditionByNumber(condition, this.roundedNumber, otherBigNumbers, this.parsedValue, otherValues);
  }

  public meetFullTexts(fulltexts: string[]): boolean {
    return valueMeetFulltexts(this.format(), fulltexts);
  }

  public valueByCondition(condition: ConditionType, values: ConditionValue[]): any {
    return valueByConditionNumber(this, condition, values, '19s');
  }
}

function parseInputValue(value: any): any {
  if (isNumeric(value)) {
    return toNumber(value) * 1000;
  }
  return value;
}
