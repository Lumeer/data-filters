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
import numbro from 'numbro';

import {NumericDataValue} from './data-value';
import {compareBigNumbers, isNumeric, removeNonNumberCharacters, toNumber, escapeHtml, isNotNullOrUndefined, isNullOrUndefined, unescapeHtml, dataValuesMeetConditionByNumber, valueByConditionNumber, valueMeetFulltexts, convertToBig, decimalStoreToUser, decimalUserToStore, formatUnknownDataValue} from '../utils';
import {ConditionType, ConditionValue, LanguageTag, NumberConstraintConfig} from '../model';
import {registerAndSetLanguage} from '../state/language-state';
import {ConstraintData} from '../constraint';

export class NumberDataValue implements NumericDataValue {
  public readonly bigNumber: Big;
  private readonly locale: LanguageTag;

  constructor(
    public readonly value: any,
    public readonly config: NumberConstraintConfig,
    public readonly constraintData?: ConstraintData,
    public readonly inputValue?: string,
  ) {
    this.locale = config?.locale || LanguageTag.USA;
    registerAndSetLanguage(config?.currency || this.locale, this.locale, this.constraintData?.currencyData);
    const parsedValue = this.parseValue(value, config, inputValue);
    const unformatted = numbro.unformat(parsedValue, parseNumbroConfig(config));
    this.bigNumber = convertToBig(unformatted);
  }

  private parseValue(value: any, config: NumberConstraintConfig, inputValue?: string): any {
    if (typeof value === 'number' || (isNullOrUndefined(inputValue) && isNumeric(value))) {
      return toNumber(value);
    }

    if (config?.separated || config?.currency) {
      return inputValue || value;
    }

    return decimalUserToStore(String(inputValue || value || '')).replace(',', '.');
  }

  public format(overrideConfig?: Partial<NumberConstraintConfig>): string {
    if (isNotNullOrUndefined(this.inputValue)) {
      return removeNonNumberCharacters(this.inputValue);
    }

    if (this.bigNumber) {
      return this.formatBigNumber(this.bigNumber, overrideConfig);
    }

    return formatUnknownDataValue(this.value);
  }

  private formatBigNumber(big: Big, overrideConfig?: Partial<NumberConstraintConfig>): string {
    const numbroConfig = parseNumbroConfig(this.config, overrideConfig);
    if (this.config?.currency) {
      registerAndSetLanguage(LanguageTag.USA, this.locale, this.constraintData?.currencyData);
      const numbroObject = numbro(this.bigNumber.toFixed());
      registerAndSetLanguage(this.config.currency, this.locale, this.constraintData?.currencyData);
      return numbroObject.formatCurrency(numbroConfig);
    }
    return numbro(big.toFixed()).format(numbroConfig);
  }

  public preview(overrideConfig?: Partial<NumberConstraintConfig>): string {
    return this.format(overrideConfig);
  }

  public title(overrideConfig?: Partial<NumberConstraintConfig>): string {
    return unescapeHtml(this.format(overrideConfig));
  }

  public editValue(): string {
    if (isNotNullOrUndefined(this.inputValue)) {
      return removeNonNumberCharacters(this.inputValue);
    }

    if (this.bigNumber) {
      const separator = this.getCurrencyDecimalSeparator();
      return decimalStoreToUser(this.bigNumber.toFixed(), separator);
    }

    return unescapeHtml(formatUnknownDataValue(this.value));
  }

  private getCurrencyDecimalSeparator(): string {
    if (this.config?.currency) {
      return numbro.languages()[this.config.currency]?.delimiters?.decimal;
    }
    return null;
  }

  public serialize(): any {
    if (this.bigNumber) {
      return this.bigNumber.toFixed();
    }
    return isNotNullOrUndefined(this.value) ? escapeHtml(decimalUserToStore(String(this.value).trim())) : null;
  }

  public isValid(ignoreConfig?: boolean): boolean {
    if (isNotNullOrUndefined(this.inputValue)) {
      return this.inputValue === '' || !!this.bigNumber;
    }
    if (!this.value) {
      return true;
    }
    if (!this.bigNumber) {
      return false;
    }
    return Boolean(ignoreConfig) || checkNumberRange(this.bigNumber, this.config);
  }

  public increment(): NumberDataValue {
    return this.bigNumber && new NumberDataValue(this.bigNumber.add(1), this.config, this.constraintData);
  }

  public decrement(): NumberDataValue {
    return this.bigNumber && new NumberDataValue(this.bigNumber.sub(1), this.config, this.constraintData);
  }

  public compareTo(otherValue: NumberDataValue): number {
    return compareBigNumbers(this.bigNumber, otherValue.bigNumber);
  }

  public copy(newValue?: any): NumberDataValue {
    const value = newValue !== undefined ? newValue : this.value;
    return new NumberDataValue(value, this.config, this.constraintData);
  }

  public parseInput(inputValue: string): NumberDataValue {
    return new NumberDataValue(inputValue, this.config, this.constraintData, inputValue);
  }

  public meetCondition(condition: ConditionType, values: ConditionValue[]): boolean {
    const dataValues = (values || []).map(value => new NumberDataValue(value.value, this.config, this.constraintData));
    const otherBigNumbers = dataValues.map(value => value.bigNumber);
    const otherValues = dataValues.map(value => value.value);

    return dataValuesMeetConditionByNumber(condition, this.bigNumber, otherBigNumbers, this.value, otherValues);
  }

  public meetFullTexts(fulltexts: string[]): boolean {
    return valueMeetFulltexts(this.format(), fulltexts);
  }

  public valueByCondition(condition: ConditionType, values: ConditionValue[]): any {
    return valueByConditionNumber(this, condition, values, '19');
  }
}

function parseNumbroConfig(
  config: NumberConstraintConfig,
  overrideConfig?: Partial<NumberConstraintConfig>
): numbro.Format {
  if (!config && !overrideConfig) {
    return {};
  }

  const numbroConfig: numbro.Format = {};
  if (overrideConfig?.forceSign || config.forceSign) {
    numbroConfig.forceSign = true;
  }
  if (overrideConfig?.separated || config.separated) {
    numbroConfig.thousandSeparated = true;
    numbroConfig.spaceSeparated = true;
  }
  if (overrideConfig?.currency || config.currency) {
    numbroConfig.spaceSeparatedCurrency = numbro.languageData().currencyFormat.spaceSeparatedCurrency || false;
  }
  numbroConfig.average = overrideConfig?.compact || config.compact || false;

  if (overrideConfig?.negative || config.negative) {
    numbroConfig.negative = 'parenthesis';
  }
  const decimals = isNotNullOrUndefined(overrideConfig?.decimals) ? overrideConfig?.decimals : config.decimals;
  if (isNumeric(decimals)) {
    numbroConfig.mantissa = decimals;
    numbroConfig.trimMantissa = isNumeric(overrideConfig?.decimals);
  }
  return numbroConfig;
}

function checkNumberRange(n: Big, config?: NumberConstraintConfig): boolean {
  let passed = true;
  if (config && config.minValue) {
    passed = n.gte(config.minValue);
  }
  if (config && config.maxValue) {
    passed = passed && n.lte(config.maxValue);
  }

  return passed;
}
