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

import Big, {BigSource} from 'big.js';
import {isNotNullOrUndefined, isNullOrUndefined} from './common.utils';
import {removeTrailingZeroesFromString} from './string.utils';

export function isNumeric(value: any): boolean {
    if (isNullOrUndefined(value) || typeof value === 'boolean' || String(value).trim() === '') {
        return false;
    }
    return !isNaN(toNumber(value));
}

export function toNumber(value: any): number {
    const val = value && value.toString().replace(/\s/g, '').replace(',', '.');

    return Number(val);
}

export function convertBigToNumberSafely(big: Big, decimals = 0): number | string {
    const value = big && removeTrailingZeroesFromString(big.toFixed(decimals > 0 ? decimals : 0));
    return value && !value.includes('.') ? convertStringToNumberSafely(value) : value;
}

export function convertStringToNumberSafely(value: string): number | string {
    return !value || String(value).length >= String(Number.MAX_SAFE_INTEGER).length ? value : parseInt(value, 10);
}

export function compareBigNumbers(first: Big, second: Big): number {
    if (!first && !second) {
        return 0;
    }
    if (!first || !second) {
        return first ? 1 : -1;
    }

    return first.cmp(second);
}

export function createBigWithoutTrailingZeros(value: BigSource): Big {
    if (!value) {
        return null;
    }

    const big = new Big(value);
    while (big.c[big.c.length - 1] === 0 && big.c.length > 1) {
        big.c.pop();
    }
    return big;
}

export function removeNonNumberCharacters(value: any): string {
    return (isNotNullOrUndefined(value) ? value : '')
        .toString()
        .replace(/[^0-9,.eE\s-]/g, '')
        .replace(/-/g, (str, index) => (index > 0 ? '' : str));
}
