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

import moment from 'moment';

import {DateTimeDataValue} from './datetime.data-value';
import {ConditionType, DateTimeConstraintConditionValue, DateTimeConstraintConfig, LanguageTag} from '../model';
import {ConstraintData} from '../constraint';

describe('DateTimeDataValue', () => {
  const yearConfig: DateTimeConstraintConfig = {format: 'Y'};
  const monthConfig: DateTimeConstraintConfig = {format: 'MM Y'};
  const weekConfig: DateTimeConstraintConfig = {format: 'WW.YYYY'};
  const dayConfig: DateTimeConstraintConfig = {format: 'D.MM.YYYY'};
  const hoursConfig: DateTimeConstraintConfig = {format: 'D-MM-Y HH'};
  const secondsConfig: DateTimeConstraintConfig = {format: 'DD.MM.YYYY HH:mm:ss'};

  const today = moment().toDate();
  const yesterday = moment().subtract(1, 'day').toDate();
  const tomorrow = moment().add(1, 'day').toDate();
  const lastWeek = moment().subtract(1, 'week').toDate();
  const nextWeek = moment().add(1, 'week').toDate();
  const lastMonth = moment().subtract(1, 'month').toDate();
  const nextMonth = moment().add(1, 'month').toDate();

  describe('format', () => {
    const config: DateTimeConstraintConfig = {format: 'YYYY-MM-DD'};
    it('simple string', () => {
      expect(new DateTimeDataValue('2020-03-24', config).format()).toEqual('2020-03-24');
    })

    it('week config', () => {
      expect(new DateTimeDataValue('22.2020', weekConfig).format()).toEqual('22.2020');
    })

    it('only day string', () => {
      const onlyDayConfig: DateTimeConstraintConfig = {format: 'DD'};
      expect(new DateTimeDataValue('31', onlyDayConfig).format()).toEqual('31');
      expect(new DateTimeDataValue('01', onlyDayConfig).format()).toEqual('01');
      expect(new DateTimeDataValue('1', {format: 'D'}).format()).toEqual('1');
      expect(new DateTimeDataValue(31, onlyDayConfig).format()).toEqual('31');
      expect(new DateTimeDataValue('310', onlyDayConfig).format()).toEqual('31');
      expect(new DateTimeDataValue('', onlyDayConfig).format()).toEqual('');
      expect(new DateTimeDataValue(null, onlyDayConfig).format()).toEqual('');
      expect(new DateTimeDataValue(undefined, onlyDayConfig).format()).toEqual('');
    })

    const skConfig = {...config, format: 'YYYY.MMMM.DD'};
    const skConstraintData: ConstraintData = {locale: LanguageTag.Slovak};
    it('slovak', () => {
      expect(new DateTimeDataValue('2020-04-24T00:00:00.000Z', skConfig, skConstraintData).format()).toEqual('2020.apríl.24');
    })

    const csConfig = {...config, format: 'YYYY.MMMM.DD'};
    const csConstraintData: ConstraintData = {locale: LanguageTag.Czech};
    it('czech', () => {
      expect(new DateTimeDataValue('2020-04-24T00:00:00.000Z', csConfig, csConstraintData).format()).toEqual('2020.dubna.24');
    })
  });

  describe('meet condition', () => {
    it('equals by specific date', () => {
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 10, 20), yearConfig).meetCondition(ConditionType.Equals, [
          {value: new Date(2019, 3, 10, 20, 30)},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 10, 20), monthConfig).meetCondition(ConditionType.Equals, [
          {value: new Date(2019, 10, 10, 20, 30)},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(
          new Date(2019, 10, 20, 10, 20, 30, 123),
          secondsConfig
        ).meetCondition(ConditionType.Equals, [{value: new Date(2019, 10, 20, 10, 20, 30, 500)}])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 10, 20), dayConfig).meetCondition(ConditionType.NotEquals, [
          {value: new Date(2019, 10, 20, 20, 30, 12)},
        ])
      ).toBeFalsy();
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 10, 20), yearConfig).meetCondition(ConditionType.NotEquals, [
          {value: new Date(2018, 3, 10, 20, 30)},
        ])
      ).toBeTruthy();
    });

    it('equals by today', () => {
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(ConditionType.Equals, [
          {type: DateTimeConstraintConditionValue.Today},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(yesterday, secondsConfig).meetCondition(ConditionType.Equals, [
          {type: DateTimeConstraintConditionValue.Today},
        ])
      ).toBeFalsy();
      expect(
        new DateTimeDataValue(tomorrow, secondsConfig).meetCondition(ConditionType.NotEquals, [
          {type: DateTimeConstraintConditionValue.Today},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(ConditionType.NotEquals, [
          {type: DateTimeConstraintConditionValue.Today},
        ])
      ).toBeFalsy();
    });

    it('equals by yesterday', () => {
      expect(
        new DateTimeDataValue(yesterday, secondsConfig).meetCondition(ConditionType.Equals, [
          {type: DateTimeConstraintConditionValue.Yesterday},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(tomorrow, secondsConfig).meetCondition(ConditionType.Equals, [
          {type: DateTimeConstraintConditionValue.Yesterday},
        ])
      ).toBeFalsy();
      expect(
        new DateTimeDataValue(lastWeek, secondsConfig).meetCondition(ConditionType.NotEquals, [
          {type: DateTimeConstraintConditionValue.Yesterday},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(yesterday, secondsConfig).meetCondition(ConditionType.NotEquals, [
          {type: DateTimeConstraintConditionValue.Yesterday},
        ])
      ).toBeFalsy();
    });

    it('equals by tomorrow', () => {
      expect(
        new DateTimeDataValue(tomorrow, secondsConfig).meetCondition(ConditionType.Equals, [
          {type: DateTimeConstraintConditionValue.Tomorrow},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(ConditionType.Equals, [
          {type: DateTimeConstraintConditionValue.Tomorrow},
        ])
      ).toBeFalsy();
      expect(
        new DateTimeDataValue(yesterday, secondsConfig).meetCondition(ConditionType.NotEquals, [
          {type: DateTimeConstraintConditionValue.Tomorrow},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(tomorrow, secondsConfig).meetCondition(ConditionType.NotEquals, [
          {type: DateTimeConstraintConditionValue.Tomorrow},
        ])
      ).toBeFalsy();
    });

    it('equals by this week', () => {
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(ConditionType.Equals, [
          {type: DateTimeConstraintConditionValue.ThisWeek},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(nextWeek, secondsConfig).meetCondition(ConditionType.Equals, [
          {type: DateTimeConstraintConditionValue.ThisWeek},
        ])
      ).toBeFalsy();
      expect(
        new DateTimeDataValue(lastWeek, secondsConfig).meetCondition(ConditionType.NotEquals, [
          {type: DateTimeConstraintConditionValue.ThisWeek},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(ConditionType.NotEquals, [
          {type: DateTimeConstraintConditionValue.ThisWeek},
        ])
      ).toBeFalsy();
    });

    it('equals by this month', () => {
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(ConditionType.Equals, [
          {type: DateTimeConstraintConditionValue.ThisMonth},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(lastMonth, secondsConfig).meetCondition(ConditionType.Equals, [
          {type: DateTimeConstraintConditionValue.ThisMonth},
        ])
      ).toBeFalsy();
      expect(
        new DateTimeDataValue(nextMonth, secondsConfig).meetCondition(ConditionType.NotEquals, [
          {type: DateTimeConstraintConditionValue.ThisMonth},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(ConditionType.NotEquals, [
          {type: DateTimeConstraintConditionValue.ThisMonth},
        ])
      ).toBeFalsy();
    });

    it('equals by last week', () => {
      expect(
        new DateTimeDataValue(lastWeek, dayConfig).meetCondition(ConditionType.Equals, [
          {type: DateTimeConstraintConditionValue.LastWeek},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(today, dayConfig).meetCondition(ConditionType.Equals, [
          {type: DateTimeConstraintConditionValue.LastWeek},
        ])
      ).toBeFalsy();
      expect(
        new DateTimeDataValue(nextMonth, dayConfig).meetCondition(ConditionType.NotEquals, [
          {type: DateTimeConstraintConditionValue.LastWeek},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(lastWeek, dayConfig).meetCondition(ConditionType.NotEquals, [
          {type: DateTimeConstraintConditionValue.LastWeek},
        ])
      ).toBeFalsy();
    });

    it('equals by last month', () => {
      expect(
        new DateTimeDataValue(lastMonth, hoursConfig).meetCondition(ConditionType.Equals, [
          {type: DateTimeConstraintConditionValue.LastMonth},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(nextWeek, hoursConfig).meetCondition(ConditionType.Equals, [
          {type: DateTimeConstraintConditionValue.LastMonth},
        ])
      ).toBeFalsy();
      expect(
        new DateTimeDataValue(nextMonth, hoursConfig).meetCondition(ConditionType.NotEquals, [
          {type: DateTimeConstraintConditionValue.LastMonth},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(lastMonth, hoursConfig).meetCondition(ConditionType.NotEquals, [
          {type: DateTimeConstraintConditionValue.LastMonth},
        ])
      ).toBeFalsy();
    });

    it('equals by next month', () => {
      expect(
        new DateTimeDataValue(nextMonth, dayConfig).meetCondition(ConditionType.Equals, [
          {type: DateTimeConstraintConditionValue.NextMonth},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(today, dayConfig).meetCondition(ConditionType.Equals, [
          {type: DateTimeConstraintConditionValue.NextMonth},
        ])
      ).toBeFalsy();
      expect(
        new DateTimeDataValue(lastWeek, dayConfig).meetCondition(ConditionType.NotEquals, [
          {type: DateTimeConstraintConditionValue.NextMonth},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(nextMonth, dayConfig).meetCondition(ConditionType.NotEquals, [
          {type: DateTimeConstraintConditionValue.NextMonth},
        ])
      ).toBeFalsy();
    });

    it('equals by next week', () => {
      expect(
        new DateTimeDataValue(nextWeek, secondsConfig).meetCondition(ConditionType.Equals, [
          {type: DateTimeConstraintConditionValue.NextWeek},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(lastWeek, secondsConfig).meetCondition(ConditionType.Equals, [
          {type: DateTimeConstraintConditionValue.NextWeek},
        ])
      ).toBeFalsy();
      expect(
        new DateTimeDataValue(lastMonth, secondsConfig).meetCondition(ConditionType.NotEquals, [
          {type: DateTimeConstraintConditionValue.NextWeek},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(nextWeek, secondsConfig).meetCondition(ConditionType.NotEquals, [
          {type: DateTimeConstraintConditionValue.NextWeek},
        ])
      ).toBeFalsy();
    });

    it('greater than by specific date', () => {
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 10, 20), dayConfig).meetCondition(ConditionType.GreaterThan, [
          {value: new Date(2019, 3, 10, 20, 30)},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 10, 20), monthConfig).meetCondition(ConditionType.GreaterThan, [
          {value: new Date(2019, 3, 10, 20, 30)},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 10, 20), yearConfig).meetCondition(ConditionType.GreaterThan, [
          {value: new Date(2019, 3, 10, 20, 30)},
        ])
      ).toBeFalsy();
    });

    it('greater than by types', () => {
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(ConditionType.GreaterThan, [
          {type: DateTimeConstraintConditionValue.Today},
        ])
      ).toBeFalsy();
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(ConditionType.GreaterThan, [
          {type: DateTimeConstraintConditionValue.Yesterday},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(tomorrow, secondsConfig).meetCondition(ConditionType.GreaterThan, [
          {type: DateTimeConstraintConditionValue.Today},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(tomorrow, secondsConfig).meetCondition(ConditionType.GreaterThan, [
          {type: DateTimeConstraintConditionValue.LastWeek},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(tomorrow, secondsConfig).meetCondition(ConditionType.GreaterThan, [
          {type: DateTimeConstraintConditionValue.LastMonth},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(lastMonth, secondsConfig).meetCondition(ConditionType.GreaterThan, [
          {type: DateTimeConstraintConditionValue.NextWeek},
        ])
      ).toBeFalsy();
    });

    it('greater than or equals last day in previous month', () => {
      const lastDayInPreviousMonthISO = moment.utc().subtract(1, 'month').endOf('month').startOf('day').toISOString();
      expect(
        new DateTimeDataValue(lastDayInPreviousMonthISO, dayConfig).meetCondition(ConditionType.GreaterThanEquals, [
          {type: DateTimeConstraintConditionValue.LastMonth},
        ])
      ).toBeTruthy();
    });

    it('lower than by specific date', () => {
      expect(
        new DateTimeDataValue(new Date(2019, 2, 20, 10, 20), dayConfig).meetCondition(ConditionType.LowerThan, [
          {value: new Date(2019, 3, 10, 20, 30)},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(new Date(2019, 3, 20, 10, 20), monthConfig).meetCondition(ConditionType.LowerThan, [
          {value: new Date(2019, 3, 10, 20, 30)},
        ])
      ).toBeFalsy();
      expect(
        new DateTimeDataValue(new Date(2018, 10, 20, 10, 20), yearConfig).meetCondition(ConditionType.LowerThan, [
          {value: new Date(2019, 3, 10, 20, 30)},
        ])
      ).toBeTruthy();
    });

    it('lower than by types', () => {
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(ConditionType.LowerThan, [
          {type: DateTimeConstraintConditionValue.Yesterday},
        ])
      ).toBeFalsy();
      expect(
        new DateTimeDataValue(yesterday, secondsConfig).meetCondition(ConditionType.LowerThan, [
          {type: DateTimeConstraintConditionValue.Today},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(lastWeek, secondsConfig).meetCondition(ConditionType.LowerThan, [
          {type: DateTimeConstraintConditionValue.Today},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(lastWeek, secondsConfig).meetCondition(ConditionType.LowerThan, [
          {type: DateTimeConstraintConditionValue.NextMonth},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(lastMonth, secondsConfig).meetCondition(ConditionType.LowerThan, [
          {type: DateTimeConstraintConditionValue.Tomorrow},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(nextMonth, secondsConfig).meetCondition(ConditionType.LowerThan, [
          {type: DateTimeConstraintConditionValue.NextWeek},
        ])
      ).toBeFalsy();
    });

    it('greater than equals by specific date', () => {
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 10, 20), dayConfig).meetCondition(
          ConditionType.GreaterThanEquals,
          [{value: new Date(2019, 10, 20, 2, 30)}]
        )
      ).toBeTruthy();

      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 10, 20), yearConfig).meetCondition(
          ConditionType.GreaterThanEquals,
          [{value: new Date(2019, 3, 10, 20, 30)}]
        )
      ).toBeTruthy();

      expect(
        new DateTimeDataValue(new Date(2019, 2, 20, 10, 20), monthConfig).meetCondition(
          ConditionType.GreaterThanEquals,
          [{value: new Date(2019, 3, 10, 20, 30)}]
        )
      ).toBeFalsy();
    });

    it('greater than equals by types', () => {
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(ConditionType.GreaterThanEquals, [
          {type: DateTimeConstraintConditionValue.Today},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(nextMonth, secondsConfig).meetCondition(ConditionType.GreaterThanEquals, [
          {type: DateTimeConstraintConditionValue.NextWeek},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(yesterday, secondsConfig).meetCondition(ConditionType.GreaterThanEquals, [
          {type: DateTimeConstraintConditionValue.Today},
        ])
      ).toBeFalsy();
    });

    it('between by specific dates', () => {
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(ConditionType.Between, [
          {value: yesterday},
          {value: tomorrow},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 1), yearConfig).meetCondition(ConditionType.Between, [
          {value: new Date(2019, 3, 20, 10)},
          {value: new Date(2019, 5, 20, 10)},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 1), dayConfig).meetCondition(ConditionType.Between, [
          {value: new Date(2019, 3, 20, 10)},
          {value: new Date(2019, 5, 20, 10)},
        ])
      ).toBeFalsy();
    });

    it('between by types', () => {
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(ConditionType.Between, [
          {type: DateTimeConstraintConditionValue.Today},
          {type: DateTimeConstraintConditionValue.Tomorrow},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(ConditionType.Between, [
          {type: DateTimeConstraintConditionValue.Tomorrow},
          {type: DateTimeConstraintConditionValue.Yesterday},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(lastWeek, secondsConfig).meetCondition(ConditionType.Between, [
          {type: DateTimeConstraintConditionValue.LastMonth},
          {type: DateTimeConstraintConditionValue.NextMonth},
        ])
      ).toBeTruthy();
    });

    it('not between by specific dates', () => {
      expect(
        new DateTimeDataValue(tomorrow, secondsConfig).meetCondition(ConditionType.NotBetween, [
          {value: yesterday},
          {value: today},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 1), dayConfig).meetCondition(ConditionType.NotBetween, [
          {value: new Date(2019, 3, 20, 10)},
          {value: new Date(2019, 5, 20, 10)},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 1), yearConfig).meetCondition(ConditionType.NotBetween, [
          {value: new Date(2019, 3, 20, 10)},
          {value: new Date(2019, 5, 20, 10)},
        ])
      ).toBeFalsy();
    });

    it('not between by types', () => {
      expect(
        new DateTimeDataValue(lastWeek, secondsConfig).meetCondition(ConditionType.NotBetween, [
          {type: DateTimeConstraintConditionValue.Today},
          {type: DateTimeConstraintConditionValue.NextWeek},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(ConditionType.NotBetween, [
          {type: DateTimeConstraintConditionValue.LastMonth},
          {type: DateTimeConstraintConditionValue.NextMonth},
        ])
      ).toBeFalsy();
      expect(
        new DateTimeDataValue(nextMonth, secondsConfig).meetCondition(ConditionType.NotBetween, [
          {type: DateTimeConstraintConditionValue.LastMonth},
          {type: DateTimeConstraintConditionValue.Today},
        ])
      ).toBeTruthy();
    });

    it('is empty', () => {
      expect(new DateTimeDataValue('  ', secondsConfig).meetCondition(ConditionType.IsEmpty, [])).toBeTruthy();
      expect(new DateTimeDataValue(0, secondsConfig).meetCondition(ConditionType.IsEmpty, [])).toBeFalsy();
      expect(new DateTimeDataValue(today, secondsConfig).meetCondition(ConditionType.IsEmpty, [])).toBeFalsy();
    });

    it('is not empty', () => {
      expect(new DateTimeDataValue(tomorrow, secondsConfig).meetCondition(ConditionType.NotEmpty, [])).toBeTruthy();
      expect(new DateTimeDataValue(0, secondsConfig).meetCondition(ConditionType.NotEmpty, [])).toBeTruthy();
      expect(new DateTimeDataValue('   ', secondsConfig).meetCondition(ConditionType.NotEmpty, [])).toBeFalsy();
    });
  });

  describe('meet fulltext', () => {
    it('multiple', () => {
      expect(new DateTimeDataValue(new Date(2019, 10, 20, 10, 20), dayConfig).meetFullTexts([])).toBeTruthy();
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 10, 20), dayConfig).meetFullTexts(['20.11.2019'])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 10, 20), dayConfig).meetFullTexts(['20', '11', '2019'])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 10, 20), yearConfig).meetFullTexts(['20', '11', '2019'])
      ).toBeFalsy();
    });
  });

  describe('parse input', () => {

    it('utc time', () => {
      const config: DateTimeConstraintConfig = {format: 'DD.MM.YYYY HH:mm', asUtc: true};
      expect(new DateTimeDataValue(new Date(), config).parseInput('19.05.2019 23:15').serialize()).toEqual('2019-05-19T23:15:00.000Z');
    });

    it('parse week config', () => {
      expect(new DateTimeDataValue(null, weekConfig).parseInput('22.2020').format()).toEqual('22.2020');
    });

    it('parse time', () => {
      const config: DateTimeConstraintConfig = {format: 'HH:mm', asUtc: true};
      expect(new DateTimeDataValue('1970-01-01T14:00:00.000Z', config, null, '8').serialize()).toEqual('1970-01-01T08:00:00.000Z');
    });
  });
});
