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
import {TeamDataValue} from './team.data-value';
import {ConditionType, TeamConstraintConditionValue, TeamConstraintConfig} from '../model';

describe('TeamDataValue', () => {
  const config: TeamConstraintConfig = {
    multi: true,
  };

  const constraintData: ConstraintData = {
    teams: [
      {id: '1', name: 'Team1', users: ['1', '2', '3']},
      {id: '2', name: 'Team2', users: ['3', '4', '5']},
      {id: '3', name: 'Team2', users: ['1', '2', '5']},
      {id: '4', name: 'Team2', users: ['2', '3', '4']},
    ],
    currentUser: {id: '3', email: 'aturing@lumeer.io', name: 'Turing'},
  };

  describe('meet condition', () => {
    it('has some', () => {
      expect(
        new TeamDataValue(['1', '2'], config, constraintData).meetCondition(ConditionType.HasSome, [
          {value: '1'},
        ])
      ).toBeTruthy();
      expect(
        new TeamDataValue(
          ['1', '2', '3'],
          config,
          constraintData
        ).meetCondition(ConditionType.HasSome, [{value: ['2', '3']}])
      ).toBeTruthy();
      expect(
        new TeamDataValue(
          ['1', '2', '3'],
          config,
          constraintData
        ).meetCondition(ConditionType.HasSome, [{value: ['4']}])
      ).toBeFalsy();
      expect(
        new TeamDataValue(['1', '10'], config, constraintData).meetCondition(
          ConditionType.HasSome,
          [{value: ['10', '11']}]
        )
      ).toBeFalsy();
      expect(
        new TeamDataValue(['1', '2'], config, constraintData).meetCondition(ConditionType.HasSome, [
          {type: TeamConstraintConditionValue.CurrentTeams},
        ])
      ).toBeTruthy();
    });

    it('has all', () => {
      expect(
          new TeamDataValue(['1', '2', '4'], config, constraintData).meetCondition(ConditionType.HasAll, [
            {type: TeamConstraintConditionValue.CurrentTeams},
          ])
      ).toBeTruthy();
    });

    it('has none of', () => {
      expect(
        new TeamDataValue(['1', '2'], config, constraintData).meetCondition(
          ConditionType.HasNoneOf,
          [{value: '10'}]
        )
      ).toBeTruthy();
      expect(
        new TeamDataValue(['1', '2'], config, constraintData).meetCondition(
          ConditionType.HasNoneOf,
          [{value: '1'}]
        )
      ).toBeFalsy();
      expect(
        new TeamDataValue(
          ['1', '2', '3'],
          config,
          constraintData
        ).meetCondition(ConditionType.HasNoneOf, [{value: ['4', '5', '6']}])
      ).toBeTruthy();
      expect(
        new TeamDataValue(
          ['1', '2', '3'],
          config,
          constraintData
        ).meetCondition(ConditionType.HasNoneOf, [{type: TeamConstraintConditionValue.CurrentTeams}])
      ).toBeFalsy();
    });

    it('is empty', () => {
      expect(new TeamDataValue('0', config, constraintData).meetCondition(ConditionType.IsEmpty, [])).toBeFalsy();
      expect(new TeamDataValue('  ', config, constraintData).meetCondition(ConditionType.IsEmpty, [])).toBeTruthy();
      expect(new TeamDataValue(null, config, constraintData).meetCondition(ConditionType.IsEmpty, [])).toBeTruthy();
      expect(
        new TeamDataValue('some team', config, constraintData).meetCondition(ConditionType.IsEmpty, [])
      ).toBeFalsy();
    });

    it('is not empty', () => {
      expect(new TeamDataValue(' 0', config, constraintData).meetCondition(ConditionType.NotEmpty, [])).toBeTruthy();
      expect(new TeamDataValue(null, config, constraintData).meetCondition(ConditionType.NotEmpty, [])).toBeFalsy();
      expect(new TeamDataValue('  ', config, constraintData).meetCondition(ConditionType.NotEmpty, [])).toBeFalsy();
    });
  });

  describe('meet fultexts', () => {
    it('single', () => {
      expect(
        new TeamDataValue(['1', '2', '3'], config, constraintData).meetFullTexts([
          'eam',
          'te',
        ])
      ).toBeTruthy();
      expect(
        new TeamDataValue(['10', '12', '30'], config, constraintData).meetFullTexts([
          'team',
        ])
      ).toBeFalsy();
    });
  });
});
