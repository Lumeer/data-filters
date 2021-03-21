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

import {NumberDataValue} from './number.data-value';
import {ConstraintData} from '../constraint';
import {ConditionType, LanguageTag, NumberConstraintConfig} from '../model';

describe('NumberDataValue', () => {
  const config: NumberConstraintConfig = {};
  const decimalsConfig: NumberConstraintConfig = {decimals: 3};
  const zeroDecimalsConfig: NumberConstraintConfig = {decimals: 0};

  const constraintData: ConstraintData = {
    currencyData: {
      ordinals: 'st|nd|rd|th'.split('|'),
      abbreviations: 'k|m|b|t'.split('|')
    },
    locale: LanguageTag.USA
  };

  describe('meet condition', () => {

    it('parse input', () => {
      expect(new NumberDataValue('20', config, constraintData, ' 300  ').serialize()).toEqual('300');

      expect(new NumberDataValue('20', config, constraintData, '10e1').serialize()).toEqual('100');

      expect(new NumberDataValue('20', config, constraintData, '23e-4').serialize()).toEqual('0.0023');
    });

    it('equals', () => {
      expect(new NumberDataValue('20', config, constraintData).meetCondition(ConditionType.Equals, [{value: 20}])).toBeTruthy();

      expect(new NumberDataValue('20', config, constraintData).meetCondition(ConditionType.Equals, [{value: '20.0'}])).toBeTruthy();

      expect(new NumberDataValue('20.000', config, constraintData).meetCondition(ConditionType.Equals, [{value: 20}])).toBeTruthy();

      expect(new NumberDataValue('20.01', config, constraintData).meetCondition(ConditionType.Equals, [{value: 20}])).toBeFalsy();

      expect(new NumberDataValue(' ', config, constraintData).meetCondition(ConditionType.Equals, [{value: null}])).toBeTruthy();

      expect(new NumberDataValue('xyz', config, constraintData).meetCondition(ConditionType.Equals, [{value: null}])).toBeFalsy();

      expect(new NumberDataValue('xyz', config, constraintData).meetCondition(ConditionType.Equals, [{value: ' xyz '}])).toBeTruthy();

      expect(new NumberDataValue(undefined, config, constraintData).meetCondition(ConditionType.Equals, [{value: null}])).toBeTruthy();

      expect(new NumberDataValue('10', config, constraintData).meetCondition(ConditionType.Equals, [{value: '5'}])).toBeFalsy();
    });

    it('equals decimals config', () => {
      expect(new NumberDataValue('20.12345', decimalsConfig, constraintData).meetCondition(ConditionType.Equals, [{value: 20.123}])).toBeTruthy();

      expect(new NumberDataValue('20.1235', decimalsConfig, constraintData).meetCondition(ConditionType.Equals, [{value: 20.123}])).toBeFalse();
    });

    it('equals zero decimals config', () => {
      expect(new NumberDataValue('1.234', zeroDecimalsConfig, constraintData).meetCondition(ConditionType.Equals, [{value: '1.2031'}])).toBeTruthy();

      expect(new NumberDataValue('1.567', zeroDecimalsConfig, constraintData).meetCondition(ConditionType.Equals, [{value: 2.2031}])).toBeTruthy();
    });

    it('not equals', () => {
      expect(new NumberDataValue('20', config, constraintData).meetCondition(ConditionType.NotEquals, [{value: 20}])).toBeFalsy();

      expect(
          new NumberDataValue(undefined, config, constraintData).meetCondition(ConditionType.NotEquals, [{value: null}])
      ).toBeFalsy();

      expect(new NumberDataValue(10, config, constraintData).meetCondition(ConditionType.NotEquals, [{value: null}])).toBeTruthy();

      expect(new NumberDataValue(10.001, config, constraintData).meetCondition(ConditionType.NotEquals, [{value: '10'}])).toBeTruthy();
    });

    it('greater than', () => {
      expect(new NumberDataValue('20', config, constraintData).meetCondition(ConditionType.GreaterThan, [{value: 20}])).toBeFalsy();

      expect(
          new NumberDataValue('20', config, constraintData).meetCondition(ConditionType.GreaterThanEquals, [{value: 20}])
      ).toBeTruthy();

      expect(new NumberDataValue(10, config, constraintData).meetCondition(ConditionType.GreaterThan, [{value: null}])).toBeFalsy();

      expect(new NumberDataValue(null, config, constraintData).meetCondition(ConditionType.GreaterThan, [{value: null}])).toBeFalsy();

      expect(new NumberDataValue(null, config, constraintData).meetCondition(ConditionType.GreaterThan, [{value: 10}])).toBeFalsy();

      expect(new NumberDataValue(10, config, constraintData).meetCondition(ConditionType.GreaterThan, [{value: 15}])).toBeFalsy();
    });

    it('lower than', () => {
      expect(new NumberDataValue('20', config, constraintData).meetCondition(ConditionType.LowerThan, [{value: 20}])).toBeFalsy();

      expect(
          new NumberDataValue('20', config, constraintData).meetCondition(ConditionType.LowerThanEquals, [{value: 20}])
      ).toBeTruthy();

      expect(new NumberDataValue(10, config, constraintData).meetCondition(ConditionType.LowerThan, [{value: null}])).toBeFalsy();

      expect(new NumberDataValue(null, config, constraintData).meetCondition(ConditionType.LowerThan, [{value: null}])).toBeFalsy();

      expect(new NumberDataValue(null, config, constraintData).meetCondition(ConditionType.LowerThan, [{value: 10}])).toBeFalsy();

      expect(new NumberDataValue(10, config, constraintData).meetCondition(ConditionType.LowerThan, [{value: 15}])).toBeTruthy();
    });

    it('between', () => {
      expect(
          new NumberDataValue('20', config, constraintData).meetCondition(ConditionType.Between, [{value: 20}, {value: 20}])
      ).toBeTruthy();

      expect(
          new NumberDataValue('20', config, constraintData).meetCondition(ConditionType.Between, [{value: 20}, {value: 17}])
      ).toBeFalsy();

      expect(
          new NumberDataValue('20', config, constraintData).meetCondition(ConditionType.Between, [{value: 10}, {value: 30}])
      ).toBeTruthy();

      expect(
          new NumberDataValue('20', config, constraintData).meetCondition(ConditionType.Between, [{value: 100}, {value: 120}])
      ).toBeFalsy();

      expect(
          new NumberDataValue(null, config, constraintData).meetCondition(ConditionType.Between, [{value: 20}, {value: 25}])
      ).toBeFalsy();
    });

    it('not between', () => {
      expect(
          new NumberDataValue('20', config, constraintData).meetCondition(ConditionType.NotBetween, [{value: 20}, {value: 20}])
      ).toBeFalsy();

      expect(
          new NumberDataValue('20', config, constraintData).meetCondition(ConditionType.NotBetween, [{value: 30}, {value: 50}])
      ).toBeTruthy();

      expect(
          new NumberDataValue('10', config, constraintData).meetCondition(ConditionType.NotBetween, [{value: 0}, {value: 30}])
      ).toBeFalsy();

      expect(
          new NumberDataValue(null, config, constraintData).meetCondition(ConditionType.NotBetween, [{value: 30}, {value: 50}])
      ).toBeFalsy();
    });

    it('is empty', () => {
      expect(new NumberDataValue('', config, constraintData).meetCondition(ConditionType.IsEmpty, [])).toBeTruthy();

      expect(new NumberDataValue('10', config, constraintData).meetCondition(ConditionType.IsEmpty, [])).toBeFalsy();

      expect(new NumberDataValue(null, config, constraintData).meetCondition(ConditionType.IsEmpty, [])).toBeTruthy();

      expect(new NumberDataValue('xxx', config, constraintData).meetCondition(ConditionType.IsEmpty, [])).toBeFalsy();

      expect(new NumberDataValue('  ', config, constraintData).meetCondition(ConditionType.IsEmpty, [])).toBeTruthy();

      expect(new NumberDataValue(undefined, config, constraintData).meetCondition(ConditionType.IsEmpty, [])).toBeTruthy();
    });

    it('is not empty', () => {
      expect(new NumberDataValue('', config, constraintData).meetCondition(ConditionType.NotEmpty, [])).toBeFalsy();

      expect(new NumberDataValue('10', config, constraintData).meetCondition(ConditionType.NotEmpty, [])).toBeTruthy();

      expect(new NumberDataValue('xxx', config, constraintData).meetCondition(ConditionType.NotEmpty, [])).toBeTruthy();
    });
  });

  describe('meet fultexts', () => {
    it('single', () => {
      expect(new NumberDataValue('10.00', config, constraintData).meetFullTexts(['10'])).toBeTruthy();
      expect(new NumberDataValue('253.21', config, constraintData).meetFullTexts(['22'])).toBeFalsy();
    });

    it('multiple', () => {
      expect(new NumberDataValue('10.456', config, constraintData).meetFullTexts(['10', '45', '6'])).toBeTruthy();
      expect(new NumberDataValue('253.21', config, constraintData).meetFullTexts(['25', '21', '22'])).toBeFalsy();
    });
  });

  describe('Format', () => {
    const emptyConfig: NumberConstraintConfig = {};
    it('Empty config', () => {
      expect(new NumberDataValue('10.11', emptyConfig, constraintData).format()).toBe('10.11');
      expect(new NumberDataValue('10,11', emptyConfig, constraintData).format()).toBe('10.11');
      expect(new NumberDataValue(10, emptyConfig, constraintData).format()).toBe('10');

      expect(new NumberDataValue('10.11', emptyConfig, constraintData, '10.11').serialize()).toBe('10.11');
      expect(new NumberDataValue('10,11', emptyConfig, constraintData, '10,11').serialize()).toBe('10.11');
      expect(new NumberDataValue(10, emptyConfig, constraintData, '10').serialize()).toBe('10');
    });

    const thousandSeparatedConfig: NumberConstraintConfig = {separated: true};
    const thousandSeparatedConfig2: NumberConstraintConfig = {decimals: 3, separated: true};
    it('Thousand separated config', () => {
      expect(new NumberDataValue('10.11', thousandSeparatedConfig, constraintData).format()).toBe('10.11');
      expect(new NumberDataValue('10,11', thousandSeparatedConfig, constraintData).format()).toBe('10.11');
      expect(new NumberDataValue('10,11', thousandSeparatedConfig,constraintData, '10,11').format()).toBe('10,11');
      expect(new NumberDataValue('10,000', thousandSeparatedConfig, constraintData).format()).toBe('10');
      expect(new NumberDataValue('10,000', thousandSeparatedConfig, constraintData, '10,000').format()).toBe('10,000');
      expect(new NumberDataValue('10,000.12345', thousandSeparatedConfig2, constraintData).format()).toBe('10,000.123');
      expect(new NumberDataValue('2,3.77777', thousandSeparatedConfig2, constraintData).format()).toBe('23.778');

      expect(new NumberDataValue('10.11', thousandSeparatedConfig, constraintData, '10.11').serialize()).toBe('10.11');
      expect(new NumberDataValue('10,11', thousandSeparatedConfig, constraintData, '10,11').serialize()).toBe('1011');
      expect(new NumberDataValue('10,000', thousandSeparatedConfig, constraintData, '10,000').serialize()).toBe('10000');
      expect(new NumberDataValue('10,000.12345', thousandSeparatedConfig2, constraintData, '10,000.12345').serialize()).toBe(
          '10000.12345'
      );
    });

    const slovakCurrencyConfig: NumberConstraintConfig = {currency: LanguageTag.Slovak};
    it('Slovak currency config', () => {
      expect(new NumberDataValue('10.11', slovakCurrencyConfig, constraintData).format()).toBe('10,11 €');
      expect(new NumberDataValue('10,11', slovakCurrencyConfig, constraintData).format()).toBe('10,11 €');
      expect(new NumberDataValue(10, slovakCurrencyConfig, constraintData).format()).toBe('10 €');

      expect(new NumberDataValue('10.11', slovakCurrencyConfig, constraintData, '10.11').serialize()).toBe('10.11');
      expect(new NumberDataValue('10,11', slovakCurrencyConfig, constraintData, '10,11').serialize()).toBe('10.11');
    });

    const usCurrencyConfig: NumberConstraintConfig = {currency: LanguageTag.USA};
    it('USA currency config', () => {
      expect(new NumberDataValue('10.11', usCurrencyConfig, constraintData).format()).toBe('$10.11');
      expect(new NumberDataValue('10,11', usCurrencyConfig, constraintData).format()).toBe('$10.11');
      expect(new NumberDataValue(10, usCurrencyConfig, constraintData).format()).toBe('$10');

      expect(new NumberDataValue('10.11', usCurrencyConfig, constraintData, '10.11').serialize()).toBe('10.11');
      expect(new NumberDataValue('10,11', usCurrencyConfig, constraintData, '10,11').serialize()).toBe('1011');
    });

    const deCurrencyConfig: NumberConstraintConfig = {currency: LanguageTag.Germany};
    it('Germany currency config', () => {
      expect(new NumberDataValue('10.11', deCurrencyConfig, constraintData).format()).toBe('10,11 €');
      expect(new NumberDataValue('10,11', deCurrencyConfig, constraintData).format()).toBe('10,11 €');
      expect(new NumberDataValue(10, deCurrencyConfig, constraintData).format()).toBe('10 €');
      expect(new NumberDataValue(10.3, deCurrencyConfig, constraintData).format()).toBe('10,3 €');

      expect(new NumberDataValue('10.11', deCurrencyConfig, constraintData, '10.11').serialize()).toBe('1011');
      expect(new NumberDataValue('10,11', deCurrencyConfig, constraintData, '10,11').serialize()).toBe('10.11');
    });
  });
});
