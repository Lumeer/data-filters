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

import {CoordinatesDataValue} from './coordinates.data-value';
import {ConditionType, CoordinatesConstraintConfig} from '../model';

describe('CoordinatesDataValue', () => {
  const config: CoordinatesConstraintConfig = {precision: 3};

  describe('meet condition', () => {
    it('equals', () => {
      expect(
        new CoordinatesDataValue('10', config).meetCondition(ConditionType.Equals, [{value: '10,0'}])
      ).toBeTruthy();

      expect(new CoordinatesDataValue('10,1', config).meetCondition(ConditionType.Equals, [{value: '1'}])).toBeFalsy();
      expect(
        new CoordinatesDataValue('10.12345', config).meetCondition(ConditionType.Equals, [{value: '10.123'}])
      ).toBeTruthy();

      expect(
        new CoordinatesDataValue('20.99999,30.88888', config).meetCondition(ConditionType.Equals, [
          {value: '21,30.889'},
        ])
      ).toBeTruthy();

      expect(
        new CoordinatesDataValue('20,30', config).meetCondition(ConditionType.Equals, [{value: '20,30.1'}])
      ).toBeFalsy();
    });

    it('not equals', () => {
      expect(
        new CoordinatesDataValue('10.9999', config).meetCondition(ConditionType.NotEquals, [{value: '10.999'}])
      ).toBeTruthy();

      expect(
        new CoordinatesDataValue('10', config).meetCondition(ConditionType.NotEquals, [{value: '10,0'}])
      ).toBeFalsy();

      expect(
        new CoordinatesDataValue('20,155', config).meetCondition(ConditionType.NotEquals, [{value: '20.000,155.0006'}])
      ).toBeTruthy();

      expect(
        new CoordinatesDataValue('20,155', config).meetCondition(ConditionType.NotEquals, [{value: '20.000,155.0004'}])
      ).toBeFalsy();
    });
    it('is empty', () => {
      expect(new CoordinatesDataValue('0', config).meetCondition(ConditionType.IsEmpty, [])).toBeFalsy();

      expect(new CoordinatesDataValue('  ', config).meetCondition(ConditionType.IsEmpty, [])).toBeTruthy();

      expect(new CoordinatesDataValue(null, config).meetCondition(ConditionType.IsEmpty, [])).toBeTruthy();
    });

    it('is not empty', () => {
      expect(new CoordinatesDataValue(' 0', config).meetCondition(ConditionType.NotEmpty, [])).toBeTruthy();

      expect(new CoordinatesDataValue(null, config).meetCondition(ConditionType.NotEmpty, [])).toBeFalsy();

      expect(new CoordinatesDataValue('  ', config).meetCondition(ConditionType.NotEmpty, [])).toBeFalsy();
    });
  });

  describe('meet fultexts', () => {
    it('single', () => {
      expect(new CoordinatesDataValue('10', config).meetFullTexts(['10.000'])).toBeTruthy();

      expect(new CoordinatesDataValue('10.123,40.234', config).meetFullTexts(['123'])).toBeTruthy();

      expect(new CoordinatesDataValue('10.123,40.234', config).meetFullTexts(['101'])).toBeFalsy();
    });
  });
});
