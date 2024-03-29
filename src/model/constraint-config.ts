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
import {AddressField} from './address';
import {LanguageTag} from './language-tag';

export interface AddressConstraintConfig {
  fields: AddressField[];
}

export interface BooleanConstraintConfig {}

export interface ColorConstraintConfig {}

export enum CoordinatesFormat {
  DecimalDegrees = 'DD',
  DegreesMinutesSeconds = 'DMS',
}

export interface CoordinatesConstraintConfig {
  format?: CoordinatesFormat;
  precision: number;
}

export interface DateTimeConstraintConfig {
  format: string;
  minValue?: Date;
  maxValue?: Date;
  range?: boolean;
  asUtc?: boolean;
}

export interface DurationConstraintConfig {
  type: DurationType;
  conversions: Record<DurationUnit, number>;
  maxUnit?: DurationUnit;
  maxUnits?: number;
  decimalPlaces?: number;
}

export enum DurationUnit {
  Weeks = 'w',
  Days = 'd',
  Hours = 'h',
  Minutes = 'm',
  Seconds = 's',
}

export const smallestDurationUnit = DurationUnit.Seconds;

export enum DurationType {
  Work = 'Work',
  Classic = 'Classic',
  Custom = 'Custom',
}

export interface FilesConstraintConfig {}

export interface NumberConstraintConfig {
  minValue?: Big;
  maxValue?: Big;
  decimals?: number; // number of decimal places
  compact?: boolean; // 12k, 5m etc..
  separated?: boolean; // 10,000 in non compact mode; 1 m in compact mode
  forceSign?: boolean; // +350
  negative?: boolean; // (100)
  currency?: LanguageTag;
}

export interface PercentageConstraintConfig {
  format?: string;
  decimals?: number;
  minValue?: number;
  maxValue?: number;
  style?: PercentageDisplayStyle;
  color?: string;
}

export enum PercentageDisplayStyle {
  Text = 'Text',
  ProgressBar = 'ProgressBar',
}

export interface RatingConstraintConfig {
  icon: string;
  text: boolean;
  minValue: number;
  maxValue: number;
}

export interface SelectConstraintOption {
  displayValue?: string;
  icon?: string;
  value: string;
  background?: string;
}

export interface SelectConstraintConfig {
  multi?: boolean;
  selectionListId?: string;
  displayValues?: boolean;
  options: SelectConstraintOption[];
}

export interface ViewConstraintConfig {
  multi?: boolean;
  openInNewWindow?: boolean;
}

export interface TagConstraintConfig {
  options: string[];
}

export enum CaseStyle {
  None = 'None',
  LowerCase = 'LowerCase',
  UpperCase = 'UpperCase',
  TitleCase = 'TitleCase',
  SentenceCase = 'SentenceCase',
}

export interface TextConstraintConfig {
  caseStyle?: CaseStyle;
  minLength?: number;
  maxLength?: number;
  regexp?: string;
}

export interface UserConstraintConfig {
  multi?: boolean;
  onlyIcon?: boolean;
  externalUsers?: boolean;
  type?: UserConstraintType;
}

export enum UserConstraintType {
  Users = 'users',
  Teams = 'teams',
  UsersAndTeams = 'usersAndTeams',
}

export interface TeamConstraintConfig {
  multi?: boolean;
}

export interface LinkConstraintConfig {
  openInApp?: boolean;
}

export interface ActionConstraintConfig {
  requiresConfirmation?: boolean;
  confirmationTitle?: string;
  rule: string;
  background: string;
  title: string;
  icon: string;
}

export type ConstraintConfig =
  | ActionConstraintConfig
  | AddressConstraintConfig
  | CoordinatesConstraintConfig
  | DateTimeConstraintConfig
  | DurationConstraintConfig
  | NumberConstraintConfig
  | PercentageConstraintConfig
  | RatingConstraintConfig
  | SelectConstraintConfig
  | LinkConstraintConfig
  | TagConstraintConfig
  | TextConstraintConfig
  | UserConstraintConfig
  | ColorConstraintConfig
  | ViewConstraintConfig;
