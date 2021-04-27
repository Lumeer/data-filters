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
import {valueMeetFulltexts, escapeHtml, unescapeHtml, compareStrings} from '../utils';
import {FilesConstraintConfig, ConditionType, ConditionValue} from '../model';

export class FilesDataValue implements DataValue {
  constructor(public readonly value: any, public readonly config: FilesConstraintConfig) {}

  public format(): string {
    return this.value || this.value === 0 ? String(this.value) : '';
  }

  public preview(): string {
    return this.format();
  }

  public serialize(): any {
    return escapeHtml(this.value);
  }

  public title(): string {
    return unescapeHtml(this.format());
  }

  public editValue(): string {
    return unescapeHtml(this.format());
  }

  public isValid(ignoreConfig?: boolean): boolean {
    return true; // only file names are stored in the value
  }

  public increment(): FilesDataValue {
    return undefined; // not supported
  }

  public decrement(): FilesDataValue {
    return undefined; // not supported
  }

  public compareTo(otherValue: FilesDataValue): number {
    return compareStrings(this.format(), otherValue.format());
  }

  public copy(newValue?: any): FilesDataValue {
    const value = newValue !== undefined ? newValue : this.value;
    return new FilesDataValue(value, this.config);
  }

  public parseInput(inputValue: string): FilesDataValue {
    return new FilesDataValue(inputValue, this.config);
  }

  public meetCondition(condition: ConditionType, values: ConditionValue[]): boolean {
    switch (condition) {
      case ConditionType.IsEmpty:
        return !this.value;
      case ConditionType.NotEmpty:
        return this.value;
      default:
        return false;
    }
  }

  public meetFullTexts(fulltexts: string[]): boolean {
    return valueMeetFulltexts(this.format(), fulltexts);
  }

  public valueByCondition(condition: ConditionType, values: ConditionValue[]): any {
    switch (condition) {
      case ConditionType.IsEmpty:
        return '';
      case ConditionType.NotEmpty:
        return 'a';
    }
  }
}
