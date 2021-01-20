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

import * as moment from 'moment';
import {createDateTimeOptions} from './date-time-options';
import {DurationUnit} from '../data/constraint-config';
import {DurationInputArg2} from 'moment';
import {DateTimeConstraint} from '../constraint/datetime.constraint';
import {ConstraintData, ConstraintType} from '../data/constraint';
import {Constraint} from '../constraint';

export function isDateValid(date: Date): boolean {
  return date && date.getTime && !isNaN(date.getTime());
}

export function resetUnusedDatePart(date: Date, format: string): Date {
  return resetUnusedMomentPart(moment(date), format).toDate();
}

export function resetUnusedMomentPart(date: moment.Moment, format: string): moment.Moment {
  if (!date || !format) {
    return date;
  }

  const dateTimeOptions = createDateTimeOptions(format);

  let dateCopy = date;
  if (!dateTimeOptions.year) {
    dateCopy = resetYear(dateCopy, dateTimeOptions.dayOfWeek);
  }

  if (!dateTimeOptions.month && !dateTimeOptions.week && !dateTimeOptions.quarter && !dateTimeOptions.dayOfWeek) {
    dateCopy = resetMonth(dateCopy);
  }

  if (!dateTimeOptions.day && !dateTimeOptions.week && !dateTimeOptions.dayOfWeek) {
    dateCopy = resetDay(dateCopy);
  }

  if (dateTimeOptions.dayOfWeek && !dateTimeOptions.month) {
    dateCopy = resetDayOfWeek(dateCopy);
  }

  if (dateTimeOptions.quarter && !dateTimeOptions.month && !dateTimeOptions.day) {
    dateCopy = resetQuarter(dateCopy);
  }

  if (dateTimeOptions.week) {
    dateCopy = resetWeek(date);
  }

  if (!dateTimeOptions.hours) {
    dateCopy = resetHours(dateCopy);
  }

  if (!dateTimeOptions.minutes) {
    dateCopy = resetMinutes(dateCopy);
  }

  if (!dateTimeOptions.seconds) {
    dateCopy = resetSeconds(dateCopy);
  }

  if (!dateTimeOptions.milliseconds) {
    dateCopy = resetMilliseconds(dateCopy);
  }

  return dateCopy;
}

function resetYear(date: moment.Moment, keepDayOfWeek = false): moment.Moment {
  if (keepDayOfWeek) {
    const diffYears = date.year() - 1970;
    const cloned = date.clone().subtract(diffYears * 52, 'week');

    if (cloned.year() === 1971) {
      return cloned.subtract(52, 'week');
    } else if (cloned.year() === 1969) {
      return cloned.add(52, 'week');
    }

    return cloned;
  }
  return date.clone().year(1970);
}

function resetMonth(date: moment.Moment): moment.Moment {
  return date.clone().month(0);
}

export function resetWeek(date: moment.Moment): moment.Moment {
  if (date.week() === 1) {
    return date.clone().day('Thursday');
  }
  return date.clone().day('Monday');
}

function resetDayOfWeek(date: moment.Moment): moment.Moment {
  return date.clone().week(2);
}

function resetQuarter(date: moment.Moment): moment.Moment {
  return date.clone().startOf('quarter');
}

function resetDay(date: moment.Moment): moment.Moment {
  return date.clone().date(1);
}

function resetHours(date: moment.Moment): moment.Moment {
  return date.clone().hours(0);
}

function resetMinutes(date: moment.Moment): moment.Moment {
  return date.clone().minutes(0);
}

function resetSeconds(date: moment.Moment): moment.Moment {
  return date.clone().seconds(0);
}

function resetMilliseconds(date: moment.Moment): moment.Moment {
  return date.clone().milliseconds(0);
}

export function getSmallestDateUnit(format: string): moment.unitOfTime.Base {
  if (/[Sx]/.test(format)) {
    return 'millisecond';
  }
  if (/[sX]/.test(format)) {
    return 'second';
  }
  if (/[m]/.test(format)) {
    return 'minute';
  }
  if (/[H]/.test(format)) {
    return 'hour';
  }
  if (/[dDeE]/.test(format)) {
    return 'day';
  }
  if (/[gGwW]/.test(format)) {
    return 'week';
  }
  if (/[M]/.test(format)) {
    return 'month';
  }
  if (/[QY]/.test(format)) {
    return 'year';
  }
  return undefined;
}

const durationUnitToMomentUnitMap: Record<DurationUnit, DurationInputArg2> = {
  [DurationUnit.Weeks]: 'weeks',
  [DurationUnit.Days]: 'days',
  [DurationUnit.Hours]: 'hours',
  [DurationUnit.Minutes]: 'minutes',
  [DurationUnit.Seconds]: 'seconds',
};

export function addDurationToDate(date: Date, durationCountsMap: Record<DurationUnit, number>): Date {
  const dateMoment = moment(date);
  Object.keys(durationCountsMap).forEach(unit => {
    dateMoment.add(durationCountsMap[unit], durationUnitToMomentUnitMap[unit]);
  });

  return dateMoment.toDate();
}

const dateFormats = ['DD.MM.YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY', 'DD.MM.'];

export function parseMomentDate(value: any, expectedFormat?: string, utc?: boolean): moment.Moment | null {
  if (!value) {
    return null;
  }

  const formats = [moment.ISO_8601, ...dateFormats];
  if (expectedFormat) {
    const result = utc ? moment.utc(value, [expectedFormat]) : moment(value, [expectedFormat]);

    if (result.isValid()) {
      return result;
    }

    formats.splice(1, 0, expectedFormat);
  }

  return utc ? moment.utc(value, formats) : moment(value, formats);
}
