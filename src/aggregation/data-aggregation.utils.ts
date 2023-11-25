import {Attribute, AttributeFilter, AttributeFilterEquation, AttributeLock, AttributeLockExceptionGroup, AttributeLockFiltersStats, AttributeLockFiltersStatsGroup, AttributeLockFilterStats, AttributeLockGroupType, AttributesResource, ConditionType, ConstraintType, DataResource, EquationOperator, UserConstraintConditionValue, UserConstraintType} from '../model';
import {ConstraintData, UnknownConstraint, UserConstraint} from '../constraint';
import {objectsByIdMap, objectValues} from '@lumeer/utils';
import {DataValue} from '../data-value';

export function isAttributeEditable(
  resource: AttributesResource,
  dataResource: DataResource,
  attribute: Attribute,
  constraintData: ConstraintData
): boolean {
  const stats = computeAttributeLockStats(dataResource, resource, attribute?.lock, constraintData);
  return isAttributeLockEnabledByLockStats(attribute?.lock, stats);
}

export function isAttributeLockEnabledByLockStats(lock: AttributeLock, stats: AttributeLockFiltersStats): boolean {
  if (lock?.locked) {
    return !!stats?.satisfy;
  }
  return !stats?.satisfy;
}

export function computeAttributeLockStats(
  dataResource: DataResource,
  resource: AttributesResource,
  lock: AttributeLock,
  constraintData?: ConstraintData
): AttributeLockFiltersStats {
  if (!dataResource || !resource) {
    return {};
  }

  const dataValues = createDataValuesMap(dataResource?.data, resource?.attributes, constraintData);
  const attributesMap = objectsByIdMap(resource?.attributes);

  return computeAttributeLockStatsByDataValues(dataValues, attributesMap, lock, constraintData);
}

export function computeAttributeLockStatsByDataValues(
  dataValues: Record<string, DataValue>,
  attributesMap: Record<string, Attribute>,
  lock: AttributeLock,
  constraintData?: ConstraintData
): AttributeLockFiltersStats {
  if (!dataValues || !attributesMap) {
    return {};
  }

  return (lock?.exceptionGroups || []).reduce<AttributeLockFiltersStats>((stats, group) => {

    if (group.type == AttributeLockGroupType.Everyone || (group.type === AttributeLockGroupType.UsersAndTeams && exceptionGroupContainsCurrentUser(group, constraintData))) {
      const filters = group.equation?.equations?.map(eq => eq.filter) || [];
      const operator = group.equation?.equations?.[0]?.operator || EquationOperator.And;
      const groupStats = dataValuesMeetsFiltersWithOperatorStats(dataValues, attributesMap, filters, constraintData, operator);

      return {
        satisfy: stats.satisfy || groupStats.satisfy,
        groups: [...stats.groups, {...groupStats, exceptionGroup: group}]
      };
    }

    return stats;
  }, {satisfy: false, groups: []});
}

function dataValuesMeetsFiltersWithOperatorStats(
  dataValues: Record<string, DataValue>,
  attributesMap: Record<string, Attribute>,
  filters: AttributeFilter[],
  constraintData: ConstraintData,
  operator: EquationOperator = EquationOperator.And
): AttributeLockFiltersStatsGroup {
  const definedFilters = filters?.filter(fil => !!attributesMap[fil.attributeId]) || [];

  const filtersStats: AttributeLockFilterStats[] = definedFilters.map(filter => {
    const meetsFilters = dataValuesMeetsFilters(dataValues, [filter], attributesMap, constraintData);
    return {filter, satisfy: meetsFilters};
  });

  let satisfy: boolean;
  if (operator === EquationOperator.Or) {
    satisfy = filtersStats.length === 0 || filtersStats.some(stats => stats.satisfy);
  } else {
    satisfy = filtersStats.length === 0 || filtersStats.every(stats => stats.satisfy);
  }

  return {filtersStats, satisfy};
}

export function isActionButtonEnabled(
  dataValues: Record<string, DataValue>,
  attributesMap: Record<string, Attribute>,
  lock: AttributeLock,
  constraintData?: ConstraintData
): boolean {
  return computeAttributeLockStatsByDataValues(dataValues, attributesMap, lock, constraintData).satisfy;
}

export function dataValuesSatisfyEquation(
  dataValues: Record<string, DataValue>,
  attributesMap: Record<string, Attribute>,
  equation: AttributeFilterEquation,
  constraintData?: ConstraintData
): boolean {
  if (!dataValues || !attributesMap) {
    return false;
  }

  const filters = equation?.equations?.map(eq => eq.filter) || [];
  const operator = equation?.equations?.[0]?.operator || EquationOperator.And;
  return dataValuesMeetsFiltersWithOperatorStats(dataValues, attributesMap, filters, constraintData, operator).satisfy;
}

export function exceptionGroupContainsCurrentUser(group: AttributeLockExceptionGroup, constraintData: ConstraintData): boolean {
  const constraint = new UserConstraint({multi: true, type: UserConstraintType.UsersAndTeams});
  const userDataValue = constraint.createDataValue(group.typeValue, constraintData);
  return userDataValue.meetCondition(ConditionType.HasSome, [{type: UserConstraintConditionValue.CurrentUser}]) ||
    userDataValue.meetCondition(ConditionType.HasSome, [{type: UserConstraintConditionValue.CurrentTeams}]);
}

export function dataValuesMeetsFilters(
  dataValues: Record<string, DataValue>,
  filters: AttributeFilter[],
  attributesMap: Record<string, Attribute>,
  constraintData?: ConstraintData
): boolean {
  if (!filters || filters.length === 0) {
    return true;
  }
  return filters.every(filter => {
    if (!dataValues[filter.attributeId]) {
      return false;
    }

    const attribute = attributesMap[filter.attributeId];
    const constraintType = attribute?.constraint?.type || ConstraintType.Unknown;
    switch (constraintType) {
      case ConstraintType.Action:
        if (filter.condition === ConditionType.Enabled) {
          return isActionButtonEnabled(dataValues, attributesMap, attribute.lock, constraintData);
        } else if (filter.condition === ConditionType.Disabled) {
          return !isActionButtonEnabled(dataValues, attributesMap, attribute.lock, constraintData);
        }
        return false;
      default:
        return dataValues[filter.attributeId].meetCondition(filter.condition, filter.conditionValues);
    }
  });
}

export function dataValuesMeetsFiltersWithOperator(
  dataResource: DataResource,
  dataValues: Record<string, DataValue>,
  resource: AttributesResource,
  attributesMap: Record<string, Attribute>,
  filters: AttributeFilter[],
  constraintData: ConstraintData,
  operator: EquationOperator = EquationOperator.And
): boolean {
  const definedFilters = filters?.filter(fil => !!attributesMap[fil.attributeId]);
  if (operator === EquationOperator.Or) {
    return (
      !definedFilters ||
      definedFilters.length === 0 ||
      definedFilters.reduce(
        (result, filter) =>
          result || dataValuesMeetsFilters(dataValues, [filter], attributesMap, constraintData),
        false
      )
    );
  }
  return dataValuesMeetsFilters(dataValues, definedFilters, attributesMap, constraintData);
}


export function dataMeetsFilters(
  dataResource: DataResource,
  data: Record<string, any>,
  resource: AttributesResource,
  attributes: Attribute[],
  filters: AttributeFilter[],
  constraintData: ConstraintData,
  operator: EquationOperator = EquationOperator.And
): boolean {
  const dataValues = createDataValuesMap(data, attributes, constraintData);
  return dataValuesMeetsFiltersWithOperator(
    dataResource,
    dataValues,
    resource,
    objectsByIdMap(attributes),
    filters,
    constraintData,
    operator
  );
}

export function dataMeetsFulltexts(
  data: Record<string, any>,
  fulltexts: string[],
  attributes: Attribute[],
  constraintData: ConstraintData
): boolean {
  if (!fulltexts || fulltexts.length === 0) {
    return true;
  }

  const dataValues = createDataValuesMap(data, attributes, constraintData);
  return fulltexts.some(fulltext => objectValues(dataValues).some(dataValue => dataValue.meetFullTexts([fulltext])));
}

export function createDataValuesMap(
  data: Record<string, any>,
  attributes: Attribute[],
  constraintData: ConstraintData
): Record<string, DataValue> {
  return (attributes || []).reduce(
    (map, attribute) => ({
      ...map,
      [attribute.id]: (attribute.constraint || new UnknownConstraint()).createDataValue(
        data?.[attribute.id],
        constraintData
      ),
    }),
    {}
  );
}
