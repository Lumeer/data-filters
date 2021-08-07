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

import {Attribute, Collection, ConstraintType, LanguageTag, LinkType} from '../model';
import {FilesConstraint} from './files.constraint';
import {Constraint} from './constraint';
import {AddressConstraint} from './address.constraint';
import {BooleanConstraint} from './boolean.constraint';
import {ActionConstraint} from './action.constraint';
import {ColorConstraint} from './color.constraint';
import {CoordinatesConstraint} from './coordinates.constraint';
import {DateTimeConstraint} from './datetime.constraint';
import {DurationConstraint} from './duration.constraint';
import {NumberConstraint} from './number.constraint';
import {PercentageConstraint} from './percentage.constraint';
import {SelectConstraint} from './select.constraint';
import {TextConstraint} from './text.constraint';
import {UserConstraint} from './user.constraint';
import {LinkConstraint} from './link.constraint';
import {UnknownConstraint} from './unknown.constraint';
import {ViewConstraint} from './view.constraint';
import {TeamConstraint} from './team.constraint';

export function createConstraint(type: string, config: any, locale?: LanguageTag): Constraint {
  switch (type) {
    case ConstraintType.Address:
      return new AddressConstraint(config);
    case ConstraintType.Boolean:
      return new BooleanConstraint();
    case ConstraintType.Action:
      return new ActionConstraint(config);
    case ConstraintType.Color:
      return new ColorConstraint(config);
    case ConstraintType.Coordinates:
      return new CoordinatesConstraint(config);
    case ConstraintType.DateTime:
      return new DateTimeConstraint(config);
    case ConstraintType.Duration:
      return new DurationConstraint(config);
    case ConstraintType.Files:
      return new FilesConstraint();
    case ConstraintType.Number:
      return new NumberConstraint({...config, locale});
    case ConstraintType.Percentage:
      return new PercentageConstraint(config);
    case ConstraintType.Select:
      return new SelectConstraint(config);
    case ConstraintType.Text:
      return new TextConstraint(config);
    case ConstraintType.User:
      return new UserConstraint(config);
    case ConstraintType.Team:
      return new TeamConstraint(config);
    case ConstraintType.Link:
      return new LinkConstraint(config);
    case ConstraintType.View:
      return new ViewConstraint(config);
    default:
      return new UnknownConstraint();
  }
}

export function createConstraintsInCollections(collections: Collection[], locale?: LanguageTag): Collection[] {
  return collections.map(collection => createConstraintsInCollection(collection, locale));
}

export function createConstraintsInCollection(collection: Collection, locale?: LanguageTag): Collection {
  return {...collection, attributes: createConstraintsInAttributes(collection?.attributes, locale)};
}

export function createConstraintsInAttributes(attributes: Attribute[], locale?: LanguageTag): Attribute[] {
    return (attributes || []).map(attribute => ({...attribute, constraint: createConstraint(attribute.constraint?.type, attribute.constraint?.config, locale)}));
}

export function createConstraintsInLinkTypes(linkTypes: LinkType[], locale?: LanguageTag): LinkType[] {
    return linkTypes.map(collection => createConstraintsInLinkType(collection, locale));
}

export function createConstraintsInLinkType(linkType: LinkType, locale?: LanguageTag): LinkType {
    return {...linkType, attributes: createConstraintsInAttributes(linkType?.attributes, locale)};
}
