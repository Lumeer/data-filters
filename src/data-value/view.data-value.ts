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

import {ConstraintData} from '../constraint';
import {DataValue} from './data-value';
import {arrayIntersection, isArray, isNotNullOrUndefined, unescapeHtml, valueMeetFulltexts, compareStrings} from '../utils';
import {ConditionType, ConditionValue, View, ViewConstraintConfig} from '../model';

export class ViewDataValue implements DataValue {
  public readonly views: View[];

  constructor(
    public readonly value: any,
    public readonly config: ViewConstraintConfig,
    public readonly constraintData: ConstraintData,
    public readonly inputValue?: string
  ) {
    this.views = this.createViews();
  }

  private createViews(): View[] {
    const views = this.constraintData?.views || [];
    const valueIds: any[] = (isArray(this.value) ? this.value : [this.value]).filter(
      val => isNotNullOrUndefined(val) && String(val).trim()
    );
    return valueIds
      .map(valueId => {
        const view = views.find(view => view.id === valueId);
        if (view) {
          return view;
        }
        return {id: valueId, name: ''};
        })
      .filter(view => !!view);
  }

  public format(): string {
    if (isNotNullOrUndefined(this.inputValue)) {
      return this.inputValue;
    }

    return this.views.map(view => view.name).filter(name => !!name).join(', ');
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
    if (this.config?.multi) {
      return this.views.map(view => view.id);
    }

    return this.views?.[0]?.id || null;
  }

  public isValid(ignoreConfig?: boolean): boolean {
    return true;
  }

  public increment(): ViewDataValue {
    return undefined; // not supported
  }

  public decrement(): ViewDataValue {
    return undefined; // not supported
  }

  public compareTo(otherValue: ViewDataValue): number {
    return compareStrings(this.format(), otherValue.format());
  }

  public copy(newValue?: any): ViewDataValue {
    const value = newValue !== undefined ? newValue : this.value;
    return new ViewDataValue(value, this.config, this.constraintData);
  }

  public parseInput(inputValue: string): ViewDataValue {
    return new ViewDataValue(inputValue, this.config, this.constraintData, inputValue);
  }

  public meetCondition(condition: ConditionType, values: ConditionValue[]): boolean {
    const dataValues = values?.map(value => this.mapQueryConditionValue(value));
    const otherViews = (dataValues.length > 0 && dataValues[0].views) || [];

    switch (condition) {
      case ConditionType.HasSome:
      case ConditionType.Equals:
        return this.views.some(view => (otherViews || []).some(otherView => view.id === otherView.id));
      case ConditionType.HasNoneOf:
      case ConditionType.NotEquals:
        return this.views.every(view => (otherViews || []).every(otherView => view.id !== otherView.id));
      case ConditionType.In:
        return (
          this.views.length > 0 &&
          this.views.every(view => otherViews.some(otherView => view.id === otherView.id))
        );
      case ConditionType.HasAll:
        return (
          arrayIntersection(
            otherViews.map(o => o.id),
            this.views.map(o => o.id)
          ).length === otherViews.length
        );
      case ConditionType.IsEmpty:
        return this.views.length === 0 && this.format().trim().length === 0;
      case ConditionType.NotEmpty:
        return this.views.length > 0 || this.format().trim().length > 0;
      default:
        return false;
    }
  }

  private mapQueryConditionValue(value: ConditionValue): ViewDataValue {
    return new ViewDataValue(value.value, this.config, this.constraintData);
  }

  public meetFullTexts(fulltexts: string[]): boolean {
    return valueMeetFulltexts(this.format(), fulltexts);
  }

  public valueByCondition(condition: ConditionType, values: ConditionValue[]): any {
    const dataValues = values?.map(value => this.mapQueryConditionValue(value));
    const otherViews = dataValues?.[0]?.views || [];

    switch (condition) {
      case ConditionType.HasSome:
      case ConditionType.Equals:
      case ConditionType.In:
        return otherViews?.[0]?.id;
      case ConditionType.HasAll:
        return values[0].value;
      case ConditionType.HasNoneOf:
      case ConditionType.NotEquals:
        const noneOptions = (this.constraintData?.views || []).filter(
          view => !otherViews.some(otherView => otherView.id === view.id)
        );
        return noneOptions?.[0]?.id;
      case ConditionType.IsEmpty:
        return '';
      case ConditionType.NotEmpty:
        return this.constraintData?.views?.[0]?.id;
      default:
        return null;
    }
  }
}
