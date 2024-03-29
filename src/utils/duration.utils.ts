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

import Big from 'big.js';
import numbro from 'numbro';
import {DurationUnitsMap} from '../constraint';
import {DurationConstraintConfig, DurationType, DurationUnit, smallestDurationUnit} from '../model';
import {convertToBig, isNumeric, objectValues, toNumber} from '@lumeer/utils';

export const sortedDurationUnits = [
  DurationUnit.Weeks,
  DurationUnit.Days,
  DurationUnit.Hours,
  DurationUnit.Minutes,
  DurationUnit.Seconds,
];

export function durationConstraintUnitMaxValue(unit: DurationUnit): number {
  switch (unit) {
    case DurationUnit.Weeks:
      return 7;
    case DurationUnit.Days:
      return 24;
    case DurationUnit.Hours:
      return 60;
    case DurationUnit.Minutes:
      return 60;
    case DurationUnit.Seconds:
      return 1000;
  }
  return 1;
}

export function getDefaultDurationUnitConversion(type: DurationType, unit: DurationUnit): number {
  switch (unit) {
    case DurationUnit.Weeks:
      return type === DurationType.Work ? 5 : 7; // to days
    case DurationUnit.Days:
      return type === DurationType.Work ? 8 : 24; // to hours
    case DurationUnit.Hours:
      return 60; // to minutes
    case DurationUnit.Minutes:
      return 60; // to seconds
    case DurationUnit.Seconds:
      return 1000; // to milliseconds
  }
}

export function getDurationSaveValue(
  value: any,
  config: DurationConstraintConfig,
  durationUnitsMap: DurationUnitsMap
): any {
  if (isDurationDataValueValid(value, durationUnitsMap)) {
    if (isNumeric(value)) {
      const bigValue = convertToBig(value);
      if (bigValue) {
        return bigValue.toFixed(0);
      }
      return toNumber(value);
    } else if (isDurationValidByNativeLetters(value, durationUnitsMap)) {
      const durationToMillisMap = getDurationUnitToMillisMap(config, durationUnitsMap);
      return parseValueToDurationValue(value, durationToMillisMap);
    } else if (isDurationValidByGlobalLetters(value)) {
      const durationToMillisMap = getDurationUnitToMillisMap(config);
      return parseValueToDurationValue(value, durationToMillisMap);
    }

    return 0;
  }
  return String(value || '');
}

export function getDurationUnitToMillisMap(
  config: DurationConstraintConfig,
  durationUnitsMap?: DurationUnitsMap
): Record<string, number> {
  return objectValues(DurationUnit).reduce((map, unit) => {
    const value = getDurationUnitToMillis(unit, config.type || DurationType.Work, config.conversions);
    const key = (durationUnitsMap && durationUnitsMap[unit]) || unit;

    map[key] = value;

    return map;
  }, {});
}

function getDurationUnitToMillis(
  unit: DurationUnit,
  type: DurationType,
  conversions: Record<DurationUnit, number>
): number {
  const conversion = (conversions && conversions[unit]) || getDefaultDurationUnitConversion(type, unit);
  switch (unit) {
    case DurationUnit.Weeks:
    case DurationUnit.Days:
    case DurationUnit.Hours:
    case DurationUnit.Minutes:
      const descendantUnit = getNextDurationUnit(unit);
      return conversion * getDurationUnitToMillis(descendantUnit, type, conversions);
    case DurationUnit.Seconds:
      return conversion;
    default:
      return 1;
  }
}

function getNextDurationUnit(unit: DurationUnit): DurationUnit | null {
  const index = sortedDurationUnits.indexOf(unit);
  return sortedDurationUnits[index + 1];
}

export function getPreviousDurationUnit(unit: DurationUnit): DurationUnit | null {
  const index = sortedDurationUnits.indexOf(unit);
  return sortedDurationUnits[index - 1];
}

function parseValueToDurationValue(value: any, unitToMillisMap: Record<string, number>): string {
  const lettersRegexPart = Object.keys(unitToMillisMap).join('|');
  const regex = new RegExp(`\\d*(${lettersRegexPart})`, 'g');

  const groups = prepareDurationValue(value).match(regex) || [];

  let millis = new Big(0);
  for (const group of groups) {
    const millisPerGroup = new Big(unitToMillisMap[group[group.length - 1]]);
    const groupNumber = group.replace(/[^\d]/g, '').trim();
    const multiplier = convertToBig(groupNumber, 1);
    millis = millis.add(millisPerGroup.times(multiplier));
  }
  return millis.toFixed(0);
}

export function isDurationDataValueValid(value: any, durationUnitsMap: DurationUnitsMap, allowNegativeNumber = false): any {
  return (
    (isNumeric(value) && (allowNegativeNumber || toNumber(value) >= 0)) ||
    isDurationValidByGlobalLetters(value) ||
    isDurationValidByNativeLetters(value, durationUnitsMap)
  );
}

function isDurationValidByGlobalLetters(value: any): boolean {
  const stringValue = prepareDurationValue(value);
  if (stringValue) {
    const globalLetters = objectValues(DurationUnit);
    const globalRegex = durationInvalidityTestRegex(globalLetters);
    return !stringValue.match(globalRegex);
  }
  return false;
}

function prepareDurationValue(value: any): string {
  return (value || '').toString().trim().toLowerCase().replace(/\s/g, '');
}

function isDurationValidByNativeLetters(value: any, durationUnitsMap: DurationUnitsMap): boolean {
  const stringValue = prepareDurationValue(value);
  if (stringValue) {
    const nativeLetters = objectValues(durationUnitsMap || {});
    const nativeRegex = durationInvalidityTestRegex(nativeLetters);
    return !stringValue.match(nativeRegex);
  }
  return false;
}

function durationInvalidityTestRegex(letters: string[]): RegExp {
  return new RegExp(`[^${letters.join('')}0-9]`, 'g');
}

export function formatDurationDataValue(
  value: any,
  config: DurationConstraintConfig,
  durationUnitsMap: DurationUnitsMap,
  overrideConfig?: Partial<DurationConstraintConfig>
): string {
  const saveValue = getDurationSaveValue(value, config, durationUnitsMap);
  if (isNumeric(saveValue)) {
    const unitsCountMap = createDurationUnitsCountsMap(saveValue, config, overrideConfig);
    const decimalPlaces = overrideConfig?.decimalPlaces || config.decimalPlaces || 0;
    const resultValue = durationCountsMapToString(unitsCountMap, decimalPlaces, durationUnitsMap);
    return resultValue || (toNumber(saveValue) >= 0 ? '0' : '');
  }

  return saveValue;
}

export function emptyDurationUnitsCountsMap(): Record<DurationUnit | string, number> {
  return [...sortedDurationUnits].reduce((map, unit) => ({...map, [unit]: 0}), {});
}

export function createDurationUnitsCountsMap(
  saveValue: any,
  config: DurationConstraintConfig,
  overrideConfig?: Partial<DurationConstraintConfig>
): Record<DurationUnit | string, number> {
  if (isNumeric(saveValue)) {
    const multiplier = toNumber(saveValue) >= 0 ? 1 : -1;
    const durationToMillisMap = getDurationUnitToMillisMap(config);
    let currentDuration = convertToBig(saveValue, 0).times(new Big(multiplier));

    let usedNumUnits = 0;
    const maximumUnits = overrideConfig?.maxUnits || config.maxUnits || Number.MAX_SAFE_INTEGER;

    let durationUnits = [...sortedDurationUnits];
    if (config.maxUnit) {
      const index = durationUnits.indexOf(config.maxUnit);
      durationUnits = durationUnits.slice(index);
    }
    const decimalPlaces = overrideConfig?.decimalPlaces || config.decimalPlaces || 0;

    return durationUnits.reduce((result, unit) => {
      const unitToMillis = durationToMillisMap[unit];
      if (unitToMillis) {
        if (usedNumUnits >= maximumUnits) {
          return result;
        }

        const isLastUnit = usedNumUnits + 1 === maximumUnits || unit === smallestDurationUnit;

        const unitToMillisBig = new Big(unitToMillis);
        const numUnits = currentDuration.div(unitToMillisBig);
        let numUnitsRounded = numUnits.round(decimalPlaces, Big.roundDown);

        if (numUnits.lt(new Big(1))) {
          // rounded up for last unit if greater than 0
          result[unit] = (isLastUnit && numUnits.gt(new Big(0)) ? 1 : 0) * multiplier;
          return result;
        }

        currentDuration = currentDuration.sub(numUnitsRounded.times(unitToMillisBig));

        if (usedNumUnits + 1 === maximumUnits && currentDuration.gt(unitToMillisBig.div(2))) {
          numUnitsRounded = numUnitsRounded.add(1);
        }
        result[unit] = toNumber(numUnitsRounded.toFixed(decimalPlaces)) * multiplier;
        usedNumUnits++;
      }

      return result;
    }, {});
  }

  return {};
}

export function durationCountsMapToString(
  durationCountsMap: Record<DurationUnit, number>,
  decimalPlaces = 0,
  durationUnitsMap?: DurationUnitsMap
): string {
  let minusSignAdded = false;
  return [...sortedDurationUnits].reduce((result, unit) => {
    const numUnits = new Big(durationCountsMap[unit] || 0);
    if (numUnits.gt(new Big(0))) {
      const unitString = durationUnitsMap?.[unit] || unit;
      return result + parseResultUnitsString(numUnits, decimalPlaces) + unitString;
    } else if (numUnits.lt(new Big(0))) {
      const unitString = durationUnitsMap?.[unit] || unit;
      const numUnitsAbsolute = minusSignAdded ? numUnits.times(new Big(-1)) : numUnits;
      minusSignAdded = true;
      return result + parseResultUnitsString(numUnitsAbsolute, decimalPlaces) + unitString;
    }
    return result;
  }, '');
}

function parseResultUnitsString(numUnits: Big, decimalPlaces: number): string {
  if (decimalPlaces === 0) {
    return numUnits.toFixed(0);
  }
  return numbro(numUnits.toFixed(decimalPlaces)).format({trimMantissa: true, mantissa: decimalPlaces});
}
