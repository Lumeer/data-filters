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
import {dataValuesMeetConditionByNumber, valueByConditionNumber, valueMeetFulltexts} from '../utils';
import {ConditionType, ConditionValue, PercentageConstraintConfig, PercentageDisplayStyle} from '../model';
import {compareBigNumbers, convertBigToNumberSafely, convertToBig, createBigWithoutTrailingZeros, decimalStoreToUser, decimalUserToStore, escapeHtml, formatUnknownDataValue, isNotNullOrUndefined, isNumeric, roundBigNumber, toNumber, unescapeHtml} from '@lumeer/utils';

export class PercentageDataValue implements NumericDataValue {
  public readonly number: Big;
  private readonly roundedNumber: Big;
  private readonly parsedValue: string;

  constructor(
    public readonly value: any,
    public readonly config: PercentageConstraintConfig,
    public readonly inputValue?: string
  ) {
    const containsPercentageSign = String(value).trim().endsWith('%');
    this.parsedValue = containsPercentageSign || isNotNullOrUndefined(inputValue) ? parseInputValue(value) : value;
    this.number = convertPercentageToBig(this.parsedValue);
    this.roundedNumber = roundBigNumber(this.number, config?.decimals);
  }

  public format(overrideConfig?: Partial<PercentageConstraintConfig>, suffix: string = '%'): string {
    if (isNotNullOrUndefined(this.inputValue)) {
      return this.inputValue;
    }
    const bigNumber = overrideConfig
      ? roundBigNumber(this.number, overrideConfig?.decimals || this.config?.decimals)
      : this.roundedNumber;
    if (!bigNumber) {
      return formatUnknownDataValue(this.value);
    }

    return decimalStoreToUser(bigNumber.toString()) + suffix;
  }

  public preview(overrideConfig?: Partial<PercentageConstraintConfig>): string {
    return this.format(overrideConfig);
  }

  public title(overrideConfig?: Partial<PercentageConstraintConfig>): string {
    const title = unescapeHtml(this.format(overrideConfig));
    const style = overrideConfig?.style || this.config?.style || PercentageDisplayStyle.Text;
    if (title || style === PercentageDisplayStyle.Text) {
      return title;
    }
    return '0%';
  }

  public editValue(): string {
    return unescapeHtml(this.format(null, ''));
  }

  public serialize(): any {
    if (!this.number) {
      return this.value ? escapeHtml(String(this.value)) : '';
    }

    const decimals = this.config?.decimals >= 0 ? this.config.decimals + 2 : undefined;
    return convertBigToNumberSafely(this.number.div(100), decimals);
  }

  public isValid(ignoreConfig?: boolean): boolean {
    if (!this.value) {
      return true;
    }

    return Boolean(this.number && (ignoreConfig || this.isPercentageWithinRange()));
  }

  private isPercentageWithinRange(): boolean {
    if (!this.config) {
      return true;
    }

    const {minValue, maxValue} = this.config;
    if ((minValue || minValue === 0) && this.compareTo(this.copy(minValue / 100)) < 0) {
      return false;
    }
    return !((maxValue || maxValue === 0) && this.compareTo(this.copy(maxValue / 100)) > 0);
  }

  public increment(): PercentageDataValue {
    return (
      (this.number && new PercentageDataValue(this.number.add(1).div(100).toFixed(), this.config)) || this.copy()
    );
  }

  public decrement(): PercentageDataValue {
    return (
      (this.number && new PercentageDataValue(this.number.sub(1).div(100).toFixed(), this.config)) || this.copy()
    );
  }

  public compareTo(otherValue: PercentageDataValue): number {
    return compareBigNumbers(this.roundedNumber, otherValue.roundedNumber);
  }

  public copy(newValue?: any): PercentageDataValue {
    const value = newValue !== undefined ? newValue : this.value;
    return new PercentageDataValue(value, this.config);
  }

  public parseInput(inputValue: string): PercentageDataValue {
    return new PercentageDataValue(inputValue, this.config, inputValue);
  }

  public meetCondition(condition: ConditionType, values: ConditionValue[]): boolean {
    const dataValues = (values || []).map(value => new PercentageDataValue(value.value, this.config));
    const otherBigNumbers = dataValues.map(value => value.roundedNumber);
    const otherValues = dataValues.map(value => value.parsedValue);

    return dataValuesMeetConditionByNumber(condition, this.roundedNumber, otherBigNumbers, this.parsedValue, otherValues);
  }

  public meetFullTexts(fulltexts: string[]): boolean {
    return valueMeetFulltexts(this.format(), fulltexts);
  }

  public valueByCondition(condition: ConditionType, values: ConditionValue[]): any {
    return valueByConditionNumber(this, condition, values, '0.19', 100);
  }
}

function parseInputValue(inputValue: string): string {
  const text = decimalUserToStore(String(inputValue).trim());
  if (text && text.endsWith('%')) {
    const prefix = text.slice(0, -1);
    if (isNumeric(prefix)) {
      return parseNumericPercentageInput(prefix, inputValue);
    }
  } else {
    if (text !== undefined && text.length === 0) {
      return '';
    }
    if (isNumeric(text)) {
      return parseNumericPercentageInput(text);
    }
  }

  return String(inputValue);
}

function parseNumericPercentageInput(value: string, defaultValue?: string): string {
  try {
    return createBigWithoutTrailingZeros(moveDecimalComma(toNumber(value), -2)).toString();
  } catch (e) {
    return defaultValue !== undefined ? defaultValue : value;
  }
}

function moveDecimalComma(value: any, offset: number): string {
  const big = new Big(value);
  big.e = big.e + offset;
  return big.toString();
}

function convertPercentageToBig(value: any, decimals?: number): Big {
  let big = convertToBig(value);
  if (!big) {
    return null;
  }

  big.e = big.e + 2;

  // prevents extra zeroes after moving the decimal point
  if (big.eq('0')) {
    big = new Big('0');
  }

  if (decimals >= 0) {
    big = big.round(decimals);
  }

  return createBigWithoutTrailingZeros(big);
}
