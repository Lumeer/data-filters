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

export function uniqueValues<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

export function isArray<T>(input?: any): input is T[] {
  return Array.isArray(input);
}

export function arrayIntersection<T>(array1: T[], array2: T[]): T[] {
  const a = array1 || [];
  const b = array2 || [];
  return a.filter(x => b.includes(x));
}

export function createRange(from: number, to: number): number[] {
  const range = [...Array(to - from).keys()];
  return range.map(r => r + from);
}
