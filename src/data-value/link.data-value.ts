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

import {DataValue} from './data-value';
import {ConditionType, ConditionValue, LinkConstraintConfig} from '../model';
import {compareStrings, isEmailValid, isNotNullOrUndefined} from '@lumeer/utils';
import {valueByConditionText, valueMeetFulltexts} from './data-value.utils';

/*
 * Saved value is formatted as 'Link [Text]'
 */
export class LinkDataValue implements DataValue {
  public readonly linkValue: string;
  public readonly titleValue: string;
  public readonly rawLinkValue: string;
  public readonly rawTitleValue: string;

  constructor(
    public readonly value: string,
    public readonly config: LinkConstraintConfig,
    public readonly inputValue?: string
  ) {
    const {link: rawLink, title: rawTitle} = parseLinkValue(isNotNullOrUndefined(inputValue) ? inputValue : (value || ''));
    this.rawLinkValue = rawLink || '';
    this.rawTitleValue = rawTitle || '';
    const {link, title}  = this.checkLinkValue(this.rawLinkValue, this.rawTitleValue);
    this.linkValue = link;
    this.titleValue = title;
  }

  private checkLinkValue(link: string, title: string): {link: string, title: string} {
    if (isEmailValid(link)) {
      return {link: `mailto:${link}`, title: title || link};
    }
    return {link, title};
  }

  public format(): string {
    if (this.linkValue) {
      return `<a href="${completeLinkValue(this.linkValue)}" target="_blank">${this.titleValue || this.linkValue}</a>`;
    }
    return this.titleValue || '';
  }

  public editValue(): string {
    return formatLinkValue(this.linkValue, this.titleValue);
  }

  public preview(): string {
    return this.format();
  }

  public serialize(): any {
    return formatLinkValue(this.rawLinkValue, this.rawTitleValue);
  }

  public title(): string {
    return this.titleValue || this.linkValue;
  }

  public compareTo(otherValue: LinkDataValue): number {
    return compareStrings(this.title(), otherValue.title());
  }

  public copy(newValue?: any): LinkDataValue {
    const value = newValue !== undefined ? newValue : this.value;
    return new LinkDataValue(value, this.config);
  }

  public increment(): DataValue {
    return undefined; // not supported
  }

  public decrement(): DataValue {
    return undefined; // not supported
  }

  public isValid(ignoreConfig?: boolean): boolean {
    return !this.value || !!this.linkValue;
  }

  public meetCondition(condition: ConditionType, values: ConditionValue[]): boolean {
    const dataValues = (values || []).map(value => new LinkDataValue(value.value, this.config));
    const linkFormatted = this.linkValue?.toLowerCase().trim();
    const titleFormatted = this.titleValue?.toLowerCase().trim();
    const otherValues = dataValues.map(dataValue => (dataValue.value || '').toLowerCase().trim());

    switch (condition) {
      case ConditionType.Contains:
        return linkFormatted.includes(otherValues[0]) || titleFormatted.includes(otherValues[0]);
      case ConditionType.NotContains:
        return !linkFormatted.includes(otherValues[0]) && !titleFormatted.includes(otherValues[0]);
      case ConditionType.IsEmpty:
        return !linkFormatted && !titleFormatted;
      case ConditionType.NotEmpty:
        return !!linkFormatted || !!titleFormatted;
      default:
        return false;
    }
  }

  public meetFullTexts(fulltexts: string[]): boolean {
    return valueMeetFulltexts(this.titleValue || this.linkValue, fulltexts);
  }

  public parseInput(inputValue: string): LinkDataValue {
    return new LinkDataValue(inputValue, this.config, inputValue);
  }

  public valueByCondition(condition: ConditionType, values: ConditionValue[]): any {
    return valueByConditionText(condition, values?.[0]?.value);
  }
}

export function completeLinkValue(link: string): string {
  if (link) {
    return linkHasValidProtocol(link) ? link : `https://${link}`;
  }
  return '';
}

export function linkHasValidProtocol(link: string) {
  // https://en.wikipedia.org/wiki/List_of_URI_schemes
  const protocols = [
    'http://',
    'https://',
    'ftp://',
    'mailto:',
    'callto:',
    'spotify:',
    'bitcoin:',
    'dns:',
    'facetime:',
    'file://',
    'geo:',
    'git://',
    'imap://',
    'lastfm://',
    'market://',
    'pop://',
    'imap://',
    's3://',
    'sftp://',
    'skype:',
    'sms:',
    'ssh://',
    'svn://',
    'tag:',
    'tel:',
    'slack://',
    'zoommtg://',
    'app://',
  ];
  return protocols.some(protocol => (link || '').startsWith(protocol));
}

export function formatLinkValue(link: string, title: string): string {
  if (link && title) {
    return `${link} [${title}]`;
  } else if (link || title) {
    return link || title;
  }
  return '';
}

export function parseLinkValue(value: string): { link?: string; title?: string } {
  const trimmedValue = value ? value.trim() : value;
  if (trimmedValue && trimmedValue[trimmedValue.length - 1] === ']') {
    const titleStartIndex = trimmedValue.lastIndexOf('[');
    if (titleStartIndex !== -1) {
      const title = trimmedValue.substring(titleStartIndex + 1, trimmedValue.length - 1);
      return {
        link: trimmedValue.substring(0, titleStartIndex).trim() || title,
        title,
      };
    }
  }
  return {link: trimmedValue};
}
