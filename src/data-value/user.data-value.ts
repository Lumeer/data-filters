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
import {ConditionType, ConditionValue, Team, User, UserConstraintConditionValue, UserConstraintConfig} from '../model';
import {arrayIntersection, compareStrings, formatUnknownDataValue, isArray, isEmailValid, isNotNullOrUndefined, isNullOrUndefined, unescapeHtml, uniqueValues} from '@lumeer/utils';
import {valueMeetFulltexts} from './data-value.utils';

export class UserDataValue implements DataValue {
  public readonly users: User[];
  public readonly usersIds: string[];
  public readonly teams: Team[];
  public readonly teamsIds: string[];
  public readonly teamsUsersIds: string[];
  public readonly allUsersIds: string[];
  public readonly usersTeamsIds: string[];
  public readonly allTeamsIds: string[];

  constructor(
    public readonly value: any,
    public readonly config: UserConstraintConfig,
    public readonly constraintData: ConstraintData,
    public readonly inputValue?: string
  ) {
    const currentValue = isNotNullOrUndefined(inputValue) ? inputValue : value;
    const {users, teams} = this.createUsersAndTeams(currentValue, isNullOrUndefined(inputValue));
    this.users = users;
    this.usersIds = users.map(user => user.id);
    this.teams = teams;
    this.teamsIds = teams.map(team => team.id);
    this.teamsUsersIds = uniqueValues(teams.reduce((ids, team) => [...ids, ...(team.users || [])], []));
    this.allUsersIds = uniqueValues([...this.usersIds, ...this.teamsUsersIds]);
    this.usersTeamsIds = uniqueValues(users.reduce((ids, user) => [...ids, ...this.userTeamsIds(user)], []));
    this.allTeamsIds = uniqueValues([...this.teamsIds, ...this.usersTeamsIds]);
  }

  private userTeamsIds(user: User): string[] {
    return (this.constraintData?.teams || []).filter(team => team.users?.includes(user.id))
      .map(team => team.id);
  }

  private createUsersAndTeams(value: any, showInvalid: boolean): { users: User[], teams: Team[] } {
    const users = this.constraintData?.users || [];
    const teams = this.constraintData?.teams || [];

    const allValues: any[] = (isArray(value) ? value : [value]).filter(
      val => isNotNullOrUndefined(val) && String(val).trim()
    );

    return allValues.reduce((data, value) => {
      if (userDataValueIsTeamValue(value)) {
        const teamId = userDataValueParseTeamValue(value);
        const team = teams.find(t => t.id === teamId);
        if (team) {
          data.teams.push(team);
        }
      } else {
        const stringValue = String(value);
        const user = users.find(u => u.email === stringValue) || {id: null, email: stringValue, name: stringValue};
        if (showInvalid || user.id || (isEmailValid(stringValue) && this.config?.externalUsers)) {
          data.users.push({...user, id: user.id || user.email});
        }
      }

      return data;
    }, {users: [], teams: []});
  }

  public format(preferEmail?: boolean): string {
    if (isNotNullOrUndefined(this.inputValue)) {
      return this.inputValue;
    }

    if (this.users.length || this.teams.length) {
      const values = this.teams.map(team => team.name);
      values.push(...this.users.map(user => (preferEmail ? user.email || user.name : user.name || user.email)));
      return values.join(', ');
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
    if (this.config?.multi) {
      return this.serialize().join(',');
    }
    return this.serialize();
  }

  public serialize(): any {
    if (this.config?.multi) {
      return [...this.teamsIds.map(id => userDataValueCreateTeamValue(id)), ...this.users.map(user => user.email)];
    }

    return userDataValueCreateTeamValue(this.teams?.[0]?.id) || this.users?.[0]?.email || null;
  }

  public isValid(ignoreConfig?: boolean): boolean {
    if (isNotNullOrUndefined(this.inputValue)) {
      return true;
    }
    return !this.value || this.users.every(user => this.isUserValid(user));
  }

  private isUserValid(user: User): boolean {
    if (this.constraintData?.users?.some(u => u.email === user.email)) {
      return true;
    }
    return this.config?.externalUsers && isEmailValid(user.email);
  }

  public increment(): UserDataValue {
    return undefined; // not supported
  }

  public decrement(): UserDataValue {
    return undefined; // not supported
  }

  public compareTo(otherValue: UserDataValue): number {
    return compareStrings(this.format(), otherValue.format());
  }

  public copy(newValue?: any): UserDataValue {
    const value = newValue !== undefined ? newValue : this.value;
    return new UserDataValue(value, this.config, this.constraintData);
  }

  public parseInput(inputValue: string): UserDataValue {
    return new UserDataValue(inputValue, this.config, this.constraintData, inputValue);
  }

  public meetCondition(condition: ConditionType, values: ConditionValue[]): boolean {
    const dataValues = values?.map(value => this.mapQueryConditionValue(value));
    const dataValue = dataValues?.[0];
    const otherUsersIds = dataValue?.usersIds || [];
    const otherTeamsIds = dataValue?.teamsIds || [];
    const otherTeamsUsersIds = dataValue?.teamsUsersIds || [];

    switch (condition) {
      case ConditionType.HasSome:
      case ConditionType.Equals:
        return arrayIntersection(otherTeamsIds, this.teamsIds).length > 0 ||
          arrayIntersection(otherTeamsUsersIds, this.usersIds).length > 0 ||
          arrayIntersection(otherUsersIds, this.allUsersIds).length > 0;
      case ConditionType.HasNoneOf:
      case ConditionType.NotEquals:
        return arrayIntersection(otherTeamsIds, this.teamsIds).length === 0 &&
          arrayIntersection(otherTeamsUsersIds, this.usersIds).length === 0 &&
          arrayIntersection(otherUsersIds, this.allUsersIds).length === 0;
      case ConditionType.In:
        return (
          (this.usersIds.length > 0 || this.teamsIds.length > 0) &&
          this.teamsIds.every(teamId => otherTeamsIds.some(otherId => otherId === teamId)) &&
          this.usersIds.every(userId => otherUsersIds.some(otherId => otherId === userId))
        );
      case ConditionType.HasAll:
        return (
          arrayIntersection(otherTeamsIds, this.teamsIds).length === otherTeamsIds.length &&
          arrayIntersection(otherUsersIds, this.allUsersIds).length === otherUsersIds.length
        );
      case ConditionType.IsEmpty:
        return this.users.length === 0 && this.teams.length === 0 && this.format().trim().length === 0;
      case ConditionType.NotEmpty:
        return this.users.length > 0 || this.teams.length > 0 || this.format().trim().length > 0;
      default:
        return false;
    }
  }

  private mapQueryConditionValue(value: ConditionValue): UserDataValue {
    if (value.type === UserConstraintConditionValue.CurrentUser) {
      const currentUser = this.constraintData?.currentUser;
      return new UserDataValue(currentUser?.email, this.config, this.constraintData);
    } else if (value.type === UserConstraintConditionValue.CurrentTeams) {
      const currentUser = this.constraintData?.currentUser;
      if (currentUser) {
        const teamsIds = this.userTeamsIds(currentUser).map(teamId => userDataValueCreateTeamValue(teamId));
        return new UserDataValue(teamsIds, this.config, this.constraintData);
      }
    }
    return new UserDataValue(value.value, this.config, this.constraintData);
  }

  public meetFullTexts(fulltexts: string[]): boolean {
    return valueMeetFulltexts(this.format(false), fulltexts) || valueMeetFulltexts(this.format(true), fulltexts);
  }

  public valueByCondition(condition: ConditionType, values: ConditionValue[]): any {
    const dataValues = values?.map(value => this.mapQueryConditionValue(value));
    const otherUsers = dataValues?.[0]?.users || [];
    const otherTeams = dataValues?.[0]?.teams || [];

    switch (condition) {
      case ConditionType.HasSome:
      case ConditionType.Equals:
      case ConditionType.In:
        return userDataValueCreateTeamValue(otherTeams?.[0]?.id) || otherUsers?.[0]?.email;
      case ConditionType.HasAll:
        return values[0].value;
      case ConditionType.HasNoneOf:
      case ConditionType.NotEquals:
        const noneOptions = (this.constraintData?.users || []).filter(
          user => !otherUsers.some(otherUser => otherUser.email === user.email)
        );
        return noneOptions?.[0]?.email;
      case ConditionType.IsEmpty:
        return '';
      case ConditionType.NotEmpty:
        return this.constraintData?.currentUser?.email;
      default:
        return null;
    }
  }
}

const teamPrefix = '@';

export function userDataValueIsTeamValue(value: string): boolean {
  return (value || '').toString().startsWith(teamPrefix);
}

export function userDataValueCreateTeamValue(teamId: string): string {
  return teamId && `${teamPrefix}${teamId}`;
}

export function userDataValueParseTeamValue(value: string): string {
  return (value || '').toString().substring(teamPrefix.length);
}
