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
import {formatUnknownDataValue, arrayIntersection, isArray, isNotNullOrUndefined, unescapeHtml, valueMeetFulltexts, compareStrings} from '../utils';
import {ConditionType, ConditionValue, Team, TeamConstraintConfig, TeamConstraintConditionValue} from '../model';

export class TeamDataValue implements DataValue {
  public readonly teams: Team[];

  constructor(
    public readonly value: any,
    public readonly config: TeamConstraintConfig,
    public readonly constraintData: ConstraintData,
    public readonly inputValue?: string
  ) {
    this.teams = this.createTeams();
  }

  private createTeams(): Team[] {
    const teams = this.constraintData?.teams || [];
    const teamIds: any[] = (isArray(this.value) ? this.value : [this.value]).filter(
      val => isNotNullOrUndefined(val) && String(val).trim()
    );
    return teamIds
      .map(teamId => teams.find(u => u.id === teamId)).filter(team => !!team);
  }

  public format(): string {
    if (isNotNullOrUndefined(this.inputValue)) {
      return this.inputValue;
    }

    if (this.teams.length) {
      return this.teams.map(team => team.name).join(', ');
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
    if (this.config?.multi) {
      return this.teams.map(team => team.id);
    }

    return this.teams?.[0]?.id || null;
  }

  public isValid(ignoreConfig?: boolean): boolean {
    if (isNotNullOrUndefined(this.inputValue)) {
      return true;
    }
    return !this.value || this.teams.every(team => this.isTeamValid(team));
  }

  private isTeamValid(team: Team): boolean {
    return this.constraintData?.teams?.some(u => u.id === team.id);
  }

  public increment(): TeamDataValue {
    return undefined; // not supported
  }

  public decrement(): TeamDataValue {
    return undefined; // not supported
  }

  public compareTo(otherValue: TeamDataValue): number {
    return compareStrings(this.format(), otherValue.format());
  }

  public copy(newValue?: any): TeamDataValue {
    const value = newValue !== undefined ? newValue : this.value;
    return new TeamDataValue(value, this.config, this.constraintData);
  }

  public parseInput(inputValue: string): TeamDataValue {
    return new TeamDataValue(inputValue, this.config, this.constraintData, inputValue);
  }

  public meetCondition(condition: ConditionType, values: ConditionValue[]): boolean {
    const dataValues = values?.map(value => this.mapQueryConditionValue(value));
    const otherTeams = (dataValues.length > 0 && dataValues[0].teams) || [];

    switch (condition) {
      case ConditionType.HasSome:
      case ConditionType.Equals:
        return this.teams.some(option => (otherTeams || []).some(otherOption => otherOption.id === option.id));
      case ConditionType.HasNoneOf:
      case ConditionType.NotEquals:
        return this.teams.every(option => (otherTeams || []).every(otherOption => otherOption.id !== option.id));
      case ConditionType.In:
        return (
          this.teams.length > 0 &&
          this.teams.every(team => otherTeams.some(otherOption => otherOption.id === team.id))
        );
      case ConditionType.HasAll:
        return (
          arrayIntersection(
            otherTeams.map(o => o.id),
            this.teams.map(o => o.id)
          ).length === otherTeams.length
        );
      case ConditionType.IsEmpty:
        return this.teams.length === 0 && this.format().trim().length === 0;
      case ConditionType.NotEmpty:
        return this.teams.length > 0 || this.format().trim().length > 0;
      default:
        return false;
    }
  }

  private mapQueryConditionValue(value: ConditionValue): TeamDataValue {
    if (value.type === TeamConstraintConditionValue.CurrentTeams) {
      const currentUser = this.constraintData?.currentUser;
      if (currentUser) {
          const teams = (this.constraintData?.teams || []).filter(team => team.users?.includes(currentUser.id))
          const teamsIds = teams.map(team => team.id);
          return new TeamDataValue(teamsIds, this.config, this.constraintData);
      }
    }
    return new TeamDataValue(value.value, this.config, this.constraintData);
  }

  public meetFullTexts(fulltexts: string[]): boolean {
    return valueMeetFulltexts(this.format(), fulltexts);
  }

  public valueByCondition(condition: ConditionType, values: ConditionValue[]): any {
    const dataValues = values?.map(value => this.mapQueryConditionValue(value));
    const otherTeams = dataValues?.[0]?.teams || [];

    switch (condition) {
      case ConditionType.HasSome:
      case ConditionType.Equals:
      case ConditionType.In:
        return otherTeams?.[0]?.id;
      case ConditionType.HasAll:
        return values[0].value;
      case ConditionType.HasNoneOf:
      case ConditionType.NotEquals:
        const noneOptions = (this.constraintData?.teams || []).filter(
          team => !otherTeams.some(otherTeam => otherTeam.id === team.id)
        );
        return noneOptions?.[0]?.id;
      case ConditionType.IsEmpty:
        return '';
      case ConditionType.NotEmpty:
        return this.constraintData?.teams?.[0]?.id;
      default:
        return null;
    }
  }
}
