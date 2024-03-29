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

import {AttributeFilter, AttributeFilterEquation} from './attribute-filter';

export interface AttributeLock {
  locked?: boolean;
  exceptionGroups: AttributeLockExceptionGroup[];
}

export interface AttributeLockExceptionGroup {
  type?: AttributeLockGroupType;
  typeValue?: string[];
  equation?: AttributeFilterEquation;
}

export enum AttributeLockGroupType {
  Everyone = 'everyone',
  UsersAndTeams = 'usersAndTeams',
}

export interface AttributeLockFiltersStats {
  satisfy?: boolean;
  groups?: AttributeLockFiltersStatsGroup[];
}

export interface AttributeLockFiltersStatsGroup {
  exceptionGroup?: AttributeLockExceptionGroup;
  filtersStats: AttributeLockFilterStats[];
  satisfy: boolean;
}

export interface AttributeLockFilterStats {
  satisfy?: boolean;
  filter?: AttributeFilter;
}
