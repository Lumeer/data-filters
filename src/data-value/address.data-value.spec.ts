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

import {AddressConstraintConfig, AddressField, ConditionType} from '../model';
import {AddressDataValue} from './address.data-value';
import {ConstraintData} from '../constraint';

describe('AddressDataValue', () => {
  const config: AddressConstraintConfig = {fields: [AddressField.City, AddressField.PostalCode]};
  const constraintData: ConstraintData = {
      addressesMap: {
          'address 1': [{city: 'Košice', postalCode: '04001'}],
          'address 2' : [{city: 'Svidník', postalCode: '08901'}],
          'address 3' : [{city: 'Bratislava', postalCode: '05001'}],
          'address 4': [{city: 'Košice', postalCode: '04001'}],
      }
  }

  describe('meet condition', () => {
    it('equals', () => {
      expect(new AddressDataValue('address 1', config, constraintData).meetCondition(ConditionType.Equals, [{value: constraintData.addressesMap['address 1'][0]}])).toBeTruthy();

      expect(new AddressDataValue('address 1', config, constraintData).meetCondition(ConditionType.Equals, [{value: 'address 4'}])).toBeTruthy();

      expect(new AddressDataValue('address 1', config, constraintData).meetCondition(ConditionType.Equals, [{value: 'address 2'}])).toBeFalsy();

        expect(new AddressDataValue('Košice, 04001', config, constraintData).meetCondition(ConditionType.Equals, [{value: 'address 1'}])).toBeTruthy();

        expect(new AddressDataValue('Other 04001', config, constraintData).meetCondition(ConditionType.Equals, [{value: 'address 1'}])).toBeFalsy();

        expect(new AddressDataValue(null, config, constraintData).meetCondition(ConditionType.Equals, [{value: ''}])).toBeTruthy();

        expect(new AddressDataValue('', config, constraintData).meetCondition(ConditionType.Equals, [{value: undefined}])).toBeTruthy();
    });

    it('not equals', () => {
        expect(new AddressDataValue('address 1', config, constraintData).meetCondition(ConditionType.NotEquals, [{value: 'address 2'}])).toBeTruthy();

        expect(new AddressDataValue('Other 04001', config, constraintData).meetCondition(ConditionType.NotEquals, [{value: 'address 1'}])).toBeTruthy();

        expect(new AddressDataValue('Košice, 04001', config, constraintData).meetCondition(ConditionType.NotEquals, [{value: 'address 1'}])).toBeFalsy();

    });
    it('is empty', () => {
      expect(new AddressDataValue('     ', config, constraintData).meetCondition(ConditionType.IsEmpty, [])).toBeTruthy();

      expect(new AddressDataValue(' address 1 ', config, constraintData).meetCondition(ConditionType.IsEmpty, [])).toBeFalsy();

      expect(new AddressDataValue(null, config, constraintData).meetCondition(ConditionType.IsEmpty, [])).toBeTruthy();

      expect(new AddressDataValue('address 1', config, constraintData).meetCondition(ConditionType.IsEmpty, [])).toBeFalsy();
    });

    it('is not empty', () => {
      expect(new AddressDataValue('', config, constraintData).meetCondition(ConditionType.NotEmpty, [])).toBeFalsy();

      expect(new AddressDataValue('address 1', config, constraintData).meetCondition(ConditionType.NotEmpty, [])).toBeTruthy();

      expect(new AddressDataValue(null, config, constraintData).meetCondition(ConditionType.NotEmpty, [])).toBeFalsy();

      expect(new AddressDataValue('xyz', config, constraintData).meetCondition(ConditionType.NotEmpty, [])).toBeTruthy();
    });
  });

  describe('meet fultexts', () => {
    it('single', () => {
      expect(new AddressDataValue('address 1', config, constraintData).meetFullTexts(['kosice'])).toBeTruthy();

        expect(new AddressDataValue('address 2', config, constraintData).meetFullTexts(['svid'])).toBeTruthy();

        expect(new AddressDataValue('address 3', config, constraintData).meetFullTexts(['tisl'])).toBeTruthy();

        expect(new AddressDataValue('address 1', config, constraintData).meetFullTexts(['00'])).toBeTruthy();

        expect(new AddressDataValue('address 2', config, constraintData).meetFullTexts(['40'])).toBeFalsy();

        expect(new AddressDataValue('some other 2', config, constraintData).meetFullTexts(['other'])).toBeTruthy();

        expect(new AddressDataValue('address 1', config, constraintData).meetFullTexts(['address'])).toBeFalsy();
    });
  });
});
