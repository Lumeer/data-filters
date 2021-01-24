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

import numbro from 'numbro';
import NumbroLanguage = numbro.NumbroLanguage;

import {LanguageTag} from '../model';
import {CurrencyData} from '../constraint';

export interface Currency {
    symbol: string;
    code: string;
    placement: CurrencyPlacement;
    spaceSeparated: boolean;
    decimalSeparator: string;
    thousandSeparator: string;
}

export enum CurrencyPlacement {
    prefix = 'prefix',
    suffix = 'suffix',
}

export const currencies: Record<string, Currency> = {
    [LanguageTag.Denmark]: {
        symbol: 'kr',
        code: 'DKK',
        placement: CurrencyPlacement.suffix,
        spaceSeparated: true,
        decimalSeparator: ',',
        thousandSeparator: '.',
    },
    [LanguageTag.Switzerland]: {
        symbol: 'CHF',
        code: 'CHF',
        placement: CurrencyPlacement.suffix,
        spaceSeparated: true,
        decimalSeparator: ',',
        thousandSeparator: '’',
    },
    [LanguageTag.NewZealand]: {
        symbol: '$',
        code: 'NZD',
        placement: CurrencyPlacement.prefix,
        spaceSeparated: true,
        decimalSeparator: '.',
        thousandSeparator: ',',
    },
    [LanguageTag.FrenchCanada]: {
        symbol: '$',
        code: 'CAD',
        placement: CurrencyPlacement.suffix,
        spaceSeparated: true,
        decimalSeparator: '.',
        thousandSeparator: '\u00a0',
    },
    [LanguageTag.Canada]: {
        symbol: '$',
        code: 'CAD',
        placement: CurrencyPlacement.prefix,
        spaceSeparated: false,
        decimalSeparator: '.',
        thousandSeparator: ',',
    },
    [LanguageTag.Sweden]: {
        symbol: 'kr',
        code: 'SEK',
        placement: CurrencyPlacement.suffix,
        spaceSeparated: true,
        decimalSeparator: ',',
        thousandSeparator: '\u00a0',
    },
    [LanguageTag.Norway]: {
        symbol: 'kr',
        code: 'NOK',
        placement: CurrencyPlacement.suffix,
        spaceSeparated: true,
        decimalSeparator: ',',
        thousandSeparator: '\u00a0',
    },
    [LanguageTag.Finland]: {
        symbol: '€',
        code: 'EUR',
        placement: CurrencyPlacement.suffix,
        spaceSeparated: true,
        decimalSeparator: ',',
        thousandSeparator: '\u00a0',
    },
    [LanguageTag.Israel]: {
        symbol: '₪',
        code: 'ILS',
        placement: CurrencyPlacement.prefix,
        spaceSeparated: true,
        decimalSeparator: '.',
        thousandSeparator: ',',
    },
    [LanguageTag.Spain]: {
        symbol: '€',
        code: 'EUR',
        placement: CurrencyPlacement.suffix,
        spaceSeparated: true,
        decimalSeparator: ',',
        thousandSeparator: '.',
    },
    [LanguageTag.France]: {
        symbol: '€',
        code: 'EUR',
        placement: CurrencyPlacement.suffix,
        spaceSeparated: true,
        decimalSeparator: ',',
        thousandSeparator: '\u00a0',
    },
    [LanguageTag.Italy]: {
        symbol: '€',
        code: 'EUR',
        placement: CurrencyPlacement.suffix,
        spaceSeparated: true,
        decimalSeparator: ',',
        thousandSeparator: '.',
    },
    [LanguageTag.England]: {
        symbol: '£',
        code: 'GBP',
        placement: CurrencyPlacement.prefix,
        spaceSeparated: true,
        decimalSeparator: '.',
        thousandSeparator: ',',
    },
    [LanguageTag.Portugal]: {
        symbol: '€',
        code: 'EUR',
        placement: CurrencyPlacement.suffix,
        spaceSeparated: true,
        decimalSeparator: ',',
        thousandSeparator: '\u00a0',
    },
    [LanguageTag.Poland]: {
        symbol: 'zł',
        code: 'PLN',
        placement: CurrencyPlacement.suffix,
        spaceSeparated: true,
        decimalSeparator: ',',
        thousandSeparator: '\u00a0',
    },
    [LanguageTag.Czech]: {
        symbol: 'Kč',
        code: 'CZK',
        placement: CurrencyPlacement.suffix,
        spaceSeparated: true,
        decimalSeparator: ',',
        thousandSeparator: '\u00a0',
    },
    [LanguageTag.Slovak]: {
        symbol: '€',
        code: 'EUR',
        placement: CurrencyPlacement.suffix,
        spaceSeparated: true,
        decimalSeparator: ',',
        thousandSeparator: '\u00a0',
    },
    [LanguageTag.Hungary]: {
        symbol: 'Ft',
        code: 'HUF',
        placement: CurrencyPlacement.suffix,
        spaceSeparated: true,
        decimalSeparator: ',',
        thousandSeparator: '\u00a0',
    },
    [LanguageTag.Austria]: {
        symbol: '€',
        code: 'EUR',
        placement: CurrencyPlacement.prefix,
        spaceSeparated: true,
        decimalSeparator: ',',
        thousandSeparator: '\u00a0',
    },
    [LanguageTag.Germany]: {
        symbol: '€',
        code: 'EUR',
        placement: CurrencyPlacement.suffix,
        spaceSeparated: true,
        decimalSeparator: ',',
        thousandSeparator: '.',
    },
    [LanguageTag.USA]: {
        symbol: '$',
        code: 'USD',
        placement: CurrencyPlacement.prefix,
        spaceSeparated: false,
        decimalSeparator: '.',
        thousandSeparator: ',',
    },
    [LanguageTag.Brazil]: {
        symbol: 'R$',
        code: 'BRL',
        placement: CurrencyPlacement.prefix,
        spaceSeparated: false,
        decimalSeparator: ',',
        thousandSeparator: '.',
    },
    [LanguageTag.Taiwan]: {
        symbol: 'NT$',
        code: 'TWD',
        placement: CurrencyPlacement.prefix,
        spaceSeparated: false,
        decimalSeparator: '.',
        thousandSeparator: ',',
    },
    [LanguageTag.Netherlands]: {
        symbol: '€',
        code: 'EUR',
        placement: CurrencyPlacement.prefix,
        spaceSeparated: true,
        decimalSeparator: ',',
        thousandSeparator: '.',
    },
    [LanguageTag.China]: {
        symbol: '¥',
        code: 'CNY',
        placement: CurrencyPlacement.prefix,
        spaceSeparated: false,
        decimalSeparator: '.',
        thousandSeparator: ',',
    },
    [LanguageTag.Russia]: {
        symbol: '₽',
        code: 'RUB',
        placement: CurrencyPlacement.suffix,
        spaceSeparated: false,
        decimalSeparator: ',',
        thousandSeparator: '\u00a0',
    },
    [LanguageTag.Japan]: {
        symbol: '¥',
        code: 'JPY',
        placement: CurrencyPlacement.prefix,
        spaceSeparated: true,
        decimalSeparator: '.',
        thousandSeparator: ',',
    },
    [LanguageTag.Australia]: {
        symbol: '$',
        code: 'AUD',
        placement: CurrencyPlacement.prefix,
        spaceSeparated: true,
        decimalSeparator: '.',
        thousandSeparator: ',',
    },
    [LanguageTag.Ireland]: {
        symbol: '€',
        code: 'EUR',
        placement: CurrencyPlacement.prefix,
        spaceSeparated: false,
        decimalSeparator: '.',
        thousandSeparator: ',',
    },
    [LanguageTag.Malta]: {
        symbol: '€',
        code: 'EUR',
        placement: CurrencyPlacement.prefix,
        spaceSeparated: false,
        decimalSeparator: '.',
        thousandSeparator: ',',
    },
    [LanguageTag.Turkey]: {
        symbol: '\u20BA',
        code: 'TRY',
        placement: CurrencyPlacement.suffix,
        spaceSeparated: true,
        decimalSeparator: ',',
        thousandSeparator: '.',
    },
    [LanguageTag.Ukraine]: {
        symbol: '\u20B4',
        code: 'UAH',
        placement: CurrencyPlacement.suffix,
        spaceSeparated: false,
        decimalSeparator: ',',
        thousandSeparator: '\u00a0',
    },
    [LanguageTag.India]: {
        symbol: '₹',
        code: 'INR',
        placement: CurrencyPlacement.prefix,
        spaceSeparated: false,
        decimalSeparator: '.',
        thousandSeparator: ',',
    },
};

export function getNumbroLanguage(currencyLanguage: LanguageTag, locale: LanguageTag, data: CurrencyData): NumbroLanguage {
    return {
        languageTag: currencyLanguage,
        delimiters: {
            thousands: currencies[currencyLanguage].thousandSeparator,
            decimal: currencies[currencyLanguage].decimalSeparator,
        },
        abbreviations: {
            thousand: data?.abbreviations?.[0] || '',
            million: data?.abbreviations?.[1] || '',
            billion: data?.abbreviations?.[2] || '',
            trillion: data?.abbreviations?.[3] || '',
        },
        ordinal: (number) => ordinal(number, data),
        currency: {
            symbol: currencies[currencyLanguage].symbol,
            code: currencies[currencyLanguage].code,
            position: currencies[currencyLanguage].placement === CurrencyPlacement.prefix ? 'prefix' : 'postfix',
        },
        currencyFormat: {
            totalLength: 4,
            spaceSeparated: locale === LanguageTag.Czech,
            spaceSeparatedCurrency: currencies[currencyLanguage].spaceSeparated,
        },
        formats: {
            fourDigits: {
                totalLength: 4,
                spaceSeparated: locale === LanguageTag.Czech,
            },
            fullWithTwoDecimals: {
                output: 'currency',
                mantissa: 2,
                spaceSeparated: locale === LanguageTag.Czech,
            },
            fullWithNoDecimals: {
                output: 'currency',
                spaceSeparated: locale === LanguageTag.Czech,
                mantissa: 0,
            },
            fullWithTwoDecimalsNoCurrency: {
                mantissa: 2,
            },
        },
    };
}

export function ordinal(num: number, data: CurrencyData): string {
    const b = num % 10;
    return ~~((num % 100) / 10) === 1
        ? data?.ordinals?.[3] || ''
        : b === 1
            ? data?.ordinals?.[0] || ''
            : b === 2
                ? data?.ordinals?.[1] || ''
                : b === 3
                    ? data?.ordinals?.[2] || ''
                    : data?.ordinals?.[3] || '';
}
