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

import Big, {RoundingMode} from 'big.js';

import {isNotNullOrUndefined} from './common.utils';

const formattingTags = [
    'strong',
    'em',
    'i',
    'sup',
    'sub',
    'u',
    'strike',
    's',
    'del',
    'cite',
    'code',
    'b',
    'span',
    'p',
    'br',
    'a'
];

export function stripTextHtmlTags(text: string, keepFormattingTags: boolean = true): string {
    const htmlWithoutTags = keepFormattingTags
        ? stripFormattingHtmlTags(text, true)
        : stripFormattingHtmlTags(text)
            .replace(/<(?:.|\s)*?>/g, ' ')
            .trim();

    return htmlWithoutTags.replace(/class=".*?"/g, '');
}

function stripFormattingHtmlTags(text: string, negative?: boolean): string {
    const negativePart = negative ? '?!' : '';
    return (text || '')
        .replace(new RegExp(`<(${negativePart}\/?(${formattingTags.join('|')})\s*\/?)[^>]*>`, 'g'), negative ? ' ' : '')
        .trim();
}

export function formatUnknownDataValue(value: any, skipDecimal = false): string {
    if (value || value === 0) {
        if (!skipDecimal && !isNaN(+value)) {
            return decimalStoreToUser(String(value));
        }

        return String(value);
    }

    return '';
}

const separator = '.';

export function decimalUserToStore(value: string): string {
    return separator === '.' ? value : value.replace(separator, '.');
}

export function decimalStoreToUser(value: string, customSeparator?: string): string {
    const currentSeparator = customSeparator || separator;
    return currentSeparator === '.' ? value : value.replace('.', currentSeparator);
}

export function convertToBig(value: any, defaultValue?: number): Big {
    try {
        return new Big(String(value));
    } catch (e) {
        return isNotNullOrUndefined(defaultValue) ? new Big(defaultValue) : null;
    }
}

export function roundBigNumber(big: Big, decimalPlaces: number): Big {
    if (big && isNotNullOrUndefined(decimalPlaces) && decimalPlaces >= 0) {
        return big.round(decimalPlaces, RoundingMode.RoundHalfUp);
    }
    return big;
}

export const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export function isEmailValid(email: string): boolean {
    return email && EMAIL_REGEX.test(email);
}

