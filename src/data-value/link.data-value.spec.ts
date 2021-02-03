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

import {ConditionType, LinkConstraintConfig} from '../model';
import {LinkDataValue} from './link.data-value';

describe('LinkDataValue', () => {
  const config: LinkConstraintConfig = {};

  describe('meet condition', () => {
    it('equals', () => {
      expect(new LinkDataValue('https://www.google.sk', config).meetCondition(ConditionType.Equals, [{value: 'https://www.google.sk    [https://www.google.sk]'}])).toBeTruthy();

      expect(new LinkDataValue('https://www.google.sk  ', config).meetCondition(ConditionType.Equals, [{value: '  https://www.google.sk'}])).toBeTruthy();

      expect(new LinkDataValue('https://www.google.sk [google]', config).meetCondition(ConditionType.Equals, [{value: 'https://www.google.sk'}])).toBeFalsy();

      expect(new LinkDataValue('https://www.google.sk []', config).meetCondition(ConditionType.Equals, [{value: ''}])).toBeFalsy();

      expect(new LinkDataValue('', config).meetCondition(ConditionType.Equals, [{value: ''}])).toBeTruthy();

      expect(new LinkDataValue(null, config).meetCondition(ConditionType.Equals, [{value: ''}])).toBeTruthy();

      expect(new LinkDataValue('', config).meetCondition(ConditionType.Equals, [{value: undefined}])).toBeTruthy();

      expect(new LinkDataValue('xzy', config).meetCondition(ConditionType.Equals, [{value: '  xzy  '}])).toBeTruthy();

      expect(new LinkDataValue('[google]', config).meetCondition(ConditionType.Equals, [{value: 'google'}])).toBeTruthy();
    });

    it('not equals', () => {
      expect(new LinkDataValue('https://www.google.sk [google]', config).meetCondition(ConditionType.NotEquals, [{value: 'https://www.google.sk'}])).toBeTruthy();

      expect(new LinkDataValue('https://www.google.sk [google]', config).meetCondition(ConditionType.NotEquals, [{value: 'google'}])).toBeTruthy();

      expect(new LinkDataValue('[google]', config).meetCondition(ConditionType.NotEquals, [{value: 'google'}])).toBeFalsy();

    });
    it('is empty', () => {
      expect(new LinkDataValue('     ', config).meetCondition(ConditionType.IsEmpty, [])).toBeTruthy();

      expect(new LinkDataValue(' red ', config).meetCondition(ConditionType.IsEmpty, [])).toBeFalsy();

      expect(new LinkDataValue(null, config).meetCondition(ConditionType.IsEmpty, [])).toBeTruthy();
    });

    it('is not empty', () => {
      expect(new LinkDataValue('', config).meetCondition(ConditionType.NotEmpty, [])).toBeFalsy();

      expect(new LinkDataValue('red', config).meetCondition(ConditionType.NotEmpty, [])).toBeTruthy();

      expect(new LinkDataValue(null, config).meetCondition(ConditionType.NotEmpty, [])).toBeFalsy();

      expect(new LinkDataValue('xyz [xyz]  ', config).meetCondition(ConditionType.NotEmpty, [])).toBeTruthy();
    });
  });

  describe('meet fultexts', () => {
    it('single', () => {
      expect(new LinkDataValue('http://www.google.sk [Some page]', config).meetFullTexts(['page'])).toBeTruthy();

      expect(new LinkDataValue('http://www.google.sk [Some page]', config).meetFullTexts(['some'])).toBeTruthy();

      expect(new LinkDataValue('http://www.google.sk [Some page]', config).meetFullTexts(['google'])).toBeFalsy();

      expect(new LinkDataValue('http://www.google.sk', config).meetFullTexts(['google'])).toBeTruthy();
    });
  });
});
