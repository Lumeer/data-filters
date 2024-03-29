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

import {DataValue} from './data-value';
import {ConditionType, ConditionValue} from '../model';
import {compareStrings, escapeHtml, formatUnknownDataValue, isNotNullOrUndefined, isNumeric, toNumber, unescapeHtml} from '@lumeer/utils';
import {dataValuesMeetConditionByText, valueByConditionText, valueMeetFulltexts} from './data-value.utils';

export class UnknownDataValue implements DataValue {
  public readonly config: any = {};

  constructor(public readonly value: any, public readonly inputValue?: string) {
  }

  public format(): string {
    if (isNotNullOrUndefined(this.inputValue)) {
      return String(this.inputValue);
    }
    return formatUnknownDataValue(this.value);
  }

  public preview(): string {
    return this.format();
  }

  public title(): string {
    return unescapeHtml(this.format());
  }

  public editValue(): string {
    return unescapeHtml(this.format());
  }

  public serialize(): any {
    return escapeHtml(this.value);
  }

  public isValid(ignoreConfig?: boolean): boolean {
    return true;
  }

  public increment(): DataValue {
    return undefined; // not supported
  }

  public decrement(): DataValue {
    return undefined; // not supported
  }

  public compareTo(otherValue: DataValue): number {
    const v1 = this.format();
    const v2 = otherValue.format();
    if (isNumeric(v1) && isNumeric(v2)) {
      return toNumber(v1) - toNumber(v2);
    }

    return compareStrings(v1, v2);
  }

  public copy(newValue?: any): DataValue {
    const value = newValue !== undefined ? newValue : this.value;
    return new UnknownDataValue(value);
  }

  public parseInput(inputValue: string): DataValue {
    return new UnknownDataValue(inputValue);
  }

  public meetCondition(condition: ConditionType, values: ConditionValue[]): boolean {
    const dataValues = (values || []).map(value => new UnknownDataValue(value.value));
    const formattedValue = this.format().toLowerCase().trim();
    const otherFormattedValues = dataValues.map(dataValue => dataValue.format().toLowerCase().trim());
    return dataValuesMeetConditionByText(condition, formattedValue, otherFormattedValues);
  }

  public meetFullTexts(fulltexts: string[]): boolean {
    return valueMeetFulltexts(this.format(), fulltexts);
  }

  public valueByCondition(condition: ConditionType, values: ConditionValue[]): any {
    return valueByConditionText(condition, values[0] && values[0].value);
  }
}
