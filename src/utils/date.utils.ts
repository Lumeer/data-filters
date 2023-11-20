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
import {DurationInputArg2} from 'moment';

import {DurationUnit} from '../model';

import 'moment/locale/en-gb';
import 'moment/locale/sk';
import 'moment/locale/cs';
import 'moment/locale/cs';
import 'moment/locale/de';
import 'moment/locale/es';
import 'moment/locale/fr';

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
