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

import isEqual from 'lodash/isEqual';
import escape from 'lodash/escape';
import unescape from 'lodash/unescape';
import cloneDeep from 'lodash/cloneDeep';
import {isArray} from './array.utils';

export function isNullOrUndefined(object: any): object is null | undefined {
    return object === null || object === undefined;
}

export function isNullOrUndefinedOrEmpty(object: any): object is null | undefined {
    return object === null || object === undefined || object === '';
}

export function isNotNullOrUndefined(object: any): boolean {
    return !isNullOrUndefined(object);
}

export function escapeHtml<T extends string | number>(value: T): T {
    const unescaped = unescapeHtml(value);
    return <T>(
        (typeof unescaped === 'number' ? unescaped : isNotNullOrUndefined(unescaped) ? escape(String(unescaped)) : null)
    );
}

export function unescapeHtml<T extends string | number>(value: T): T {
    return <T>(typeof value === 'number' ? value : isNotNullOrUndefined(value) ? unescape(String(value)) : null);
}

export function objectValues<T>(object: Record<string, T>): T[] {
    // Object.values is not supported in older version of js
    return Object.keys(object || {}).map(key => object[key]);
}

export function isObject(value: any): boolean {
    return value !== null && typeof value === 'object';
}

export function deepObjectCopy<T>(object: T): T {
    return cloneDeep(object);
}

export function deepObjectsEquals(object1: any, object2: any): boolean {
    return isEqual(removeUndefinedProperties(object1), removeUndefinedProperties(object2));
}

function removeUndefinedProperties(value: any): any {
    if (isNullOrUndefined(value)) {
        return value;
    }
    if (isArray(value)) {
        return removeUndefinedPropertiesFromArray(value);
    } else if (isObject(value)) {
        return removeUndefinedPropertiesFromObject(value);
    }
    return value;
}

function removeUndefinedPropertiesFromArray(array: any[]): any[] {
    const returnArray = [];
    for (const element of array) {
        if (isNullOrUndefined(element)) {
            continue;
        }

        if (isArray(element)) {
            returnArray.push(removeUndefinedPropertiesFromArray(element));
        } else if (isObject(element)) {
            returnArray.push(removeUndefinedPropertiesFromObject(element));
        } else {
            returnArray.push(element);
        }
    }

    return returnArray;
}

function removeUndefinedPropertiesFromObject(object: any): any {
    const returnObj = {};
    Object.keys(object).forEach(key => {
        const val = object[key];
        if (isNotNullOrUndefined(val)) {
            if (isArray(val)) {
                returnObj[key] = removeUndefinedPropertiesFromArray(val);
            } else if (isObject(val)) {
                returnObj[key] = removeUndefinedPropertiesFromObject(val);
            } else {
                returnObj[key] = val;
            }
        }
    });
    return returnObj;
}

export function objectsByIdMap<T extends {id?: string}>(objects: T[]): Record<string, T> {
    return (objects || []).reduce((map, object) => ({...map, [object.id]: object}), {});
}
