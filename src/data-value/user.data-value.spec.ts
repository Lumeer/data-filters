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
import {UserDataValue, userDataValueCreateTeamValue} from './user.data-value';
import {ConditionType, UserConstraintConditionValue, UserConstraintConfig} from '../model';

describe('UserDataValue', () => {
  const config: UserConstraintConfig = {
    multi: true,
    externalUsers: true,
  };

  const constraintData: ConstraintData = {
    users: [
      {id: '1', email: 'one@lmr.com', name: 'One Lmr'},
      {id: '2', email: 'two@lmr.com', name: 'Two Lmr'},
      {id: '3', email: 'three@lmr.com', name: 'Three Lmr'},
      {id: '4', email: 'four@lmr.com', name: 'Four Lmr'},
    ],
    currentUser: {id: '2', email: 'two@lmr.com', name: 'Two Lmr'},
    teams: [
      {id: '1', name: 'team1', users: ['1', '2']},
      {id: '2', name: 'team2', users: ['1', '4']},
      {id: '3', name: 'super team3', users: ['3', '4']}
    ]
  };

  describe('init value', () => {
    const config: UserConstraintConfig = {externalUsers: true};
    it('should parse unknown user', () => {
      expect(new UserDataValue(null, config, constraintData).parseInput('unknown@user.com').serialize()).toEqual('unknown@user.com');
    });

    it('should parse unknown user by multi', () => {
      expect(new UserDataValue(null, {...config, multi: true}, constraintData).parseInput('unknown@user.com').serialize()).toEqual(['unknown@user.com']);
    });

    it('should parse empty users from inputValue', () => {
      expect(new UserDataValue(null, {...config, multi: true}, constraintData).parseInput('x').serialize()).toEqual([]);
    });
  });

  describe('meet condition', () => {
    it('has some users', () => {
      expect(
        new UserDataValue(['one@lmr.com', 'two@lmr.com'], config, constraintData).meetCondition(ConditionType.HasSome, [
          {value: 'one@lmr.com'},
        ])
      ).toBeTruthy();
      expect(
        new UserDataValue(
          ['one@lmr.com', 'two@lmr.com', 'three@lmr.com'],
          config,
          constraintData
        ).meetCondition(ConditionType.HasSome, [{value: ['two@lmr.com', 'three@lmr.com']}])
      ).toBeTruthy();
      expect(
        new UserDataValue(
          ['one@lmr.com', 'two@lmr.com', 'three@lmr.com'],
          config,
          constraintData
        ).meetCondition(ConditionType.HasSome, [{value: ['four@lmr.com']}])
      ).toBeFalsy();
      expect(
        new UserDataValue(['one@lmr.com', 'other@lmr.com'], config, constraintData).meetCondition(
          ConditionType.HasSome,
          [{value: ['lala@lmr.com', 'other@lmr.com']}]
        )
      ).toBeTruthy();
      expect(
        new UserDataValue(['one@lmr.com', 'two@lmr.com'], config, constraintData).meetCondition(ConditionType.HasSome, [
          {type: UserConstraintConditionValue.CurrentUser},
        ])
      ).toBeTruthy();
    });

    it('has some users and teams', () => {
      expect(
        new UserDataValue(['one@lmr.com', 'two@lmr.com'], config, constraintData).meetCondition(ConditionType.HasSome, [
          {value: userDataValueCreateTeamValue('1')},
        ])
      ).toBeFalsy();
      expect(
        new UserDataValue(['one@lmr.com', userDataValueCreateTeamValue('1'), 'two@lmr.com'], config, constraintData).meetCondition(ConditionType.HasSome, [
          {value: userDataValueCreateTeamValue('1')},
        ])
      ).toBeTruthy();
    });

    it('has none of', () => {
      expect(
        new UserDataValue(['one@lmr.com', 'two@lmr.com'], config, constraintData).meetCondition(
          ConditionType.HasNoneOf,
          [{value: 'other@lmr.com'}]
        )
      ).toBeTruthy();
      expect(
        new UserDataValue(['one@lmr.com', 'two@lmr.com'], config, constraintData).meetCondition(
          ConditionType.HasNoneOf,
          [{value: 'one@lmr.com'}]
        )
      ).toBeFalsy();
      expect(
        new UserDataValue(
          ['one@lmr.com', 'two@lmr.com', 'three@lmr.com'],
          config,
          constraintData
        ).meetCondition(ConditionType.HasNoneOf, [{value: ['other@lmr.com', 'four@lmr.com', 'l@lmr.com']}])
      ).toBeTruthy();
      expect(
        new UserDataValue(
          ['one@lmr.com', 'two@lmr.com', 'three@lmr.com'],
          config,
          constraintData
        ).meetCondition(ConditionType.HasNoneOf, [{type: UserConstraintConditionValue.CurrentUser}])
      ).toBeFalsy();
    });

    it('has none of users and teams', () => {
      expect(
        new UserDataValue(['one@lmr.com', 'two@lmr.com'], config, constraintData).meetCondition(ConditionType.HasNoneOf, [
          {value: userDataValueCreateTeamValue('1')},
        ])
      ).toBeTruthy();
      expect(
        new UserDataValue(['one@lmr.com', userDataValueCreateTeamValue('1'), 'two@lmr.com'], config, constraintData).meetCondition(ConditionType.HasNoneOf, [
          {value: userDataValueCreateTeamValue('1')},
        ])
      ).toBeFalsy();
      expect(
        new UserDataValue(['one@lmr.com', 'two@lmr.com'], config, constraintData).meetCondition(ConditionType.HasNoneOf, [
          {value: [userDataValueCreateTeamValue('1'), 'three@lmr.com']},
        ])
      ).toBeTruthy();
      expect(
        new UserDataValue(['one@lmr.com', 'two@lmr.com'], config, constraintData).meetCondition(ConditionType.HasNoneOf, [
          {type: UserConstraintConditionValue.CurrentTeams},
        ])
      ).toBeTruthy();
      expect(
        new UserDataValue(['one@lmr.com', userDataValueCreateTeamValue('1')], config, constraintData).meetCondition(ConditionType.HasNoneOf, [
          {type: UserConstraintConditionValue.CurrentTeams},
        ])
      ).toBeFalsy();
    });

    it('in users and teams', () => {
      expect(
        new UserDataValue([userDataValueCreateTeamValue('1')], config, constraintData).meetCondition(ConditionType.In, [
          {value: [userDataValueCreateTeamValue('1'), userDataValueCreateTeamValue('2')]},
        ])
      ).toBeTruthy();
      expect(
        new UserDataValue(['one@lmr.com', userDataValueCreateTeamValue('1')], config, constraintData).meetCondition(ConditionType.In, [
          {value: [userDataValueCreateTeamValue('1'), 'one@lmr.com', 'two@lmr.com']},
        ])
      ).toBeTruthy();
      expect(
        new UserDataValue(['one@lmr.com', 'two@lmr.com'], config, constraintData).meetCondition(ConditionType.In, [
          {value: [userDataValueCreateTeamValue('1'), 'two@lmr.com']},
        ])
      ).toBeFalsy();
    });

    it('is empty', () => {
      expect(new UserDataValue('0', config, constraintData).meetCondition(ConditionType.IsEmpty, [])).toBeFalsy();
      expect(new UserDataValue('  ', config, constraintData).meetCondition(ConditionType.IsEmpty, [])).toBeTruthy();
      expect(new UserDataValue(null, config, constraintData).meetCondition(ConditionType.IsEmpty, [])).toBeTruthy();
      expect(
        new UserDataValue('some@lmr.com', config, constraintData).meetCondition(ConditionType.IsEmpty, [])
      ).toBeFalsy();
    });

    it('is not empty', () => {
      expect(new UserDataValue(' 0', config, constraintData).meetCondition(ConditionType.NotEmpty, [])).toBeTruthy();
      expect(new UserDataValue(null, config, constraintData).meetCondition(ConditionType.NotEmpty, [])).toBeFalsy();
      expect(new UserDataValue('  ', config, constraintData).meetCondition(ConditionType.NotEmpty, [])).toBeFalsy();
    });
  });

  describe('meet fultexts', () => {
    it('single', () => {
      expect(
        new UserDataValue(['one@lmr.com', 'two@lmr.com', 'three@lmr.com'], config, constraintData).meetFullTexts([
          'Lmr',
          'One',
          'Two',
          'Three',
        ])
      ).toBeTruthy();
      expect(
        new UserDataValue(['other@lmr.com', 'else@lmr.com', 'three@lmr.com'], config, constraintData).meetFullTexts([
          'other@lmr',
          'else@',
          'Three',
        ])
      ).toBeTruthy();
      expect(
        new UserDataValue(['one@lmr.com', 'two@lmr.com', 'three@lmr.com'], config, constraintData).meetFullTexts([
          'Lmr.com',
        ])
      ).toBeFalsy();
      expect(
        new UserDataValue([userDataValueCreateTeamValue('1'), 'two@lmr.com', 'three@lmr.com'], config, constraintData).meetFullTexts([
          'team',
        ])
      ).toBeTruthy();
    });
  });
});
