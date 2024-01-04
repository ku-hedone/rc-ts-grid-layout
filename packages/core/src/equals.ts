/**
 * Cache used to store references to objects, used for circular
 * reference checks.
 */
interface Cache<Key extends object, Value> {
  delete(key: Key): boolean;
  get(key: Key): Value | undefined;
  set(key: Key, value: any): any;
}

interface State<Meta> {
  /**
   * Cache used to identify circular references
   */
  readonly cache: Cache<any, any> | undefined;
  /**
   * Method used to determine equality of nested value.
   */
  readonly equals: InternalEqualityComparator<Meta>;
  /**
   * Additional value that can be used for comparisons.
   */
  meta: Meta;
  /**
   * Whether the equality comparison is strict, meaning it matches
   * all properties (including symbols and non-enumerable properties)
   * with equal shape of descriptors.
   */
  readonly strict: boolean;
}

interface CircularState<Meta> extends State<Meta> {
  readonly cache: Cache<any, any>;
}

interface Dictionary<Value = any> {
  [key: string | symbol]: Value;
  $$typeof?: any;
}

interface ComparatorConfig<Meta> {
  /**
   * Whether the arrays passed are equal in value. In strict mode, this includes
   * additional properties added to the array.
   */
  areArraysEqual: TypeEqualityComparator<any, Meta>;
  /**
   * Whether the dates passed are equal in value.
   */
  areDatesEqual: TypeEqualityComparator<any, Meta>;
  /**
   * Whether the maps passed are equal in value. In strict mode, this includes
   * additional properties added to the map.
   */
  areMapsEqual: TypeEqualityComparator<any, Meta>;
  /**
   * Whether the objects passed are equal in value. In strict mode, this includes
   * non-enumerable properties added to the map, as well as symbol properties.
   */
  areObjectsEqual: TypeEqualityComparator<any, Meta>;
  /**
   * Whether the primitive wrappers passed are equal in value.
   */
  arePrimitiveWrappersEqual: TypeEqualityComparator<any, Meta>;
  /**
   * Whether the regexps passed are equal in value.
   */
  areRegExpsEqual: TypeEqualityComparator<any, Meta>;
  /**
   * Whether the sets passed are equal in value. In strict mode, this includes
   * additional properties added to the set.
   */
  areSetsEqual: TypeEqualityComparator<any, Meta>;
  /**
   * Whether the typed arrays passed are equal in value. In strict mode, this includes
   * additional properties added to the typed array.
   */
  areTypedArraysEqual: TypeEqualityComparator<any, Meta>;
}

type CreateCustomComparatorConfig<Meta> = (
  config: ComparatorConfig<Meta>,
) => Partial<ComparatorConfig<Meta>>;

type CreateState<Meta> = () => {
  cache?: Cache<any, any> | undefined;
  meta?: Meta;
};

type EqualityComparator<Meta> = <A, B>(a: A, b: B, state: State<Meta>) => boolean;
type AnyEqualityComparator<Meta> = (a: any, b: any, state: State<Meta>) => boolean;

type InternalEqualityComparator<Meta> = (
  a: any,
  b: any,
  indexOrKeyA: any,
  indexOrKeyB: any,
  parentA: any,
  parentB: any,
  state: State<Meta>,
) => boolean;

// We explicitly check for primitive wrapper types
// eslint-disable-next-line @typescript-eslint/ban-types
type PrimitiveWrapper = Boolean | Number | String;

/**
 * Type which encompasses possible instances of TypedArray
 * classes.
 *
 * **NOTE**: This does not include `BigInt64Array` and
 * `BitUint64Array` because those are part of ES2020 and
 * not supported by certain TS configurations. If using
 * either in `areTypedArraysEqual`, you can cast the
 * instance as `TypedArray` and it will work as expected,
 * because runtime checks will still work for those classes.
 */
type TypedArray =
  | Float32Array
  | Float64Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Uint16Array
  | Uint32Array
  | Uint8Array
  | Uint8ClampedArray;

type TypeEqualityComparator<Type, Meta = undefined> = (
  a: Type,
  b: Type,
  state: State<Meta>,
) => boolean;

interface CustomEqualCreatorOptions<Meta> {
  /**
   * Whether circular references should be supported. It causes the
   * comparison to be slower, but for objects that have circular references
   * it is required to avoid stack overflows.
   */
  circular?: boolean;
  /**
   * Create a custom configuration of type-specific equality comparators.
   * This receives the default configuration, which allows either replacement
   * or supersetting of the default methods.
   */
  createCustomConfig?: CreateCustomComparatorConfig<Meta>;
  /**
   * Create a custom internal comparator, which is used as an override to the
   * default entry point for nested value equality comparisons. This is often
   * used for doing custom logic for specific types (such as handling a specific
   * class instance differently than other objects) or to incorporate `meta` in
   * the comparison. See the recipes for examples.
   */
  createInternalComparator?: (
    compare: EqualityComparator<Meta>,
  ) => InternalEqualityComparator<Meta>;
  /**
   * Create a custom `state` object passed between the methods. This allows for
   * custom `cache` and/or `meta` values to be used.
   */
  createState?: CreateState<Meta>;
  /**
   * Whether the equality comparison is strict, meaning it matches
   * all properties (including symbols and non-enumerable properties)
   * with equal shape of descriptors.
   */
  strict?: boolean;
}

const { getOwnPropertyNames, getOwnPropertySymbols } = Object;
const { hasOwnProperty } = Object.prototype;

/**
 * Combine two comparators into a single comparators.
 */
function combineComparators<Meta>(
  comparatorA: AnyEqualityComparator<Meta>,
  comparatorB: AnyEqualityComparator<Meta>,
) {
  return function isEqual<A, B>(a: A, b: B, state: State<Meta>) {
    return comparatorA(a, b, state) && comparatorB(a, b, state);
  };
}

/**
 * Wrap the provided `areItemsEqual` method to manage the circular state, allowing
 * for circular references to be safely included in the comparison without creating
 * stack overflows.
 */
function createIsCircular<AreItemsEqual extends TypeEqualityComparator<any, any>>(
  areItemsEqual: AreItemsEqual,
): AreItemsEqual {
  return function isCircular(a: any, b: any, state: CircularState<Cache<any, any>>) {
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object') {
      return areItemsEqual(a, b, state);
    }

    const { cache } = state;

    const cachedA = cache.get(a);
    const cachedB = cache.get(b);

    if (cachedA && cachedB) {
      return cachedA === b && cachedB === a;
    }

    cache.set(a, b);
    cache.set(b, a);

    const result = areItemsEqual(a, b, state);

    cache.delete(a);
    cache.delete(b);

    return result;
  } as AreItemsEqual;
}

/**
 * Get the properties to strictly examine, which include both own properties that are
 * not enumerable and symbol properties.
 */
function getStrictProperties(object: Dictionary): Array<string | symbol> {
  return (getOwnPropertyNames(object) as Array<string | symbol>).concat(
    getOwnPropertySymbols(object),
  );
}

/**
 * Whether the object contains the property passed as an own property.
 */
const hasOwn =
  Object.hasOwn ||
  ((object: Dictionary, property: number | string | symbol) =>
    hasOwnProperty.call(object, property));

/**
 * Whether the values passed are strictly equal or both NaN.
 */
function sameValueZeroEqual(a: any, b: any): boolean {
  // eslint-disable-next-line no-self-compare
  return a || b ? a === b : a === b || (a !== a && b !== b);
}

const OWNER = '_owner';

const { getOwnPropertyDescriptor, keys } = Object;
/**
 * Whether the arrays are equal in value.
 */
function areArraysEqualDefault(a: any[], b: any[], state: State<any>) {
  let index = a.length;

  if (b.length !== index) {
    return false;
  }

  while (index-- > 0) {
    if (!state.equals(a[index], b[index], index, index, a, b, state)) {
      return false;
    }
  }

  return true;
}

/**
 * Whether the dates passed are equal in value.
 */
function areDatesEqualDefault(a: Date, b: Date): boolean {
  return sameValueZeroEqual(a.getTime(), b.getTime());
}

/**
 * Whether the `Map`s are equal in value.
 */
function areMapsEqualDefault(
  a: Map<any, any>,
  b: Map<any, any>,
  state: State<any>,
): boolean {
  if (a.size !== b.size) {
    return false;
  }

  const matchedIndices: Record<number, true> = {};
  const aIterable = a.entries();

  let index = 0;
  let aResult: IteratorResult<[any, any]>;
  let bResult: IteratorResult<[any, any]>;

  while ((aResult = aIterable.next())) {
    if (aResult.done) {
      break;
    }

    const bIterable = b.entries();

    let hasMatch = false;
    let matchIndex = 0;

    while ((bResult = bIterable.next())) {
      if (bResult.done) {
        break;
      }

      const [aKey, aValue] = aResult.value;
      const [bKey, bValue] = bResult.value;

      if (
        !hasMatch &&
        !matchedIndices[matchIndex] &&
        (hasMatch =
          state.equals(aKey, bKey, index, matchIndex, a, b, state) &&
          state.equals(aValue, bValue, aKey, bKey, a, b, state))
      ) {
        matchedIndices[matchIndex] = true;
      }

      matchIndex++;
    }

    if (!hasMatch) {
      return false;
    }

    index++;
  }

  return true;
}

/**
 * Whether the objects are equal in value.
 */
function areObjectsEqualDefault(
  a: Dictionary,
  b: Dictionary,
  state: State<any>,
): boolean {
  const properties = keys(a);

  let index = properties.length;

  if (keys(b).length !== index) {
    return false;
  }

  let property: string;

  // Decrementing `while` showed faster results than either incrementing or
  // decrementing `for` loop and than an incrementing `while` loop. Declarative
  // methods like `some` / `every` were not used to avoid incurring the garbage
  // cost of anonymous callbacks.
  while (index-- > 0) {
    property = properties[index]!;

    if (property === OWNER && (a.$$typeof || b.$$typeof) && a.$$typeof !== b.$$typeof) {
      return false;
    }

    if (
      !hasOwn(b, property) ||
      !state.equals(a[property], b[property], property, property, a, b, state)
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Whether the objects are equal in value with strict property checking.
 */
function areObjectsEqualStrictDefault(
  a: Dictionary,
  b: Dictionary,
  state: State<any>,
): boolean {
  const properties = getStrictProperties(a);

  let index = properties.length;

  if (getStrictProperties(b).length !== index) {
    return false;
  }

  let property: string | symbol;
  let descriptorA: ReturnType<typeof getOwnPropertyDescriptor>;
  let descriptorB: ReturnType<typeof getOwnPropertyDescriptor>;

  // Decrementing `while` showed faster results than either incrementing or
  // decrementing `for` loop and than an incrementing `while` loop. Declarative
  // methods like `some` / `every` were not used to avoid incurring the garbage
  // cost of anonymous callbacks.
  while (index-- > 0) {
    property = properties[index]!;

    if (property === OWNER && (a.$$typeof || b.$$typeof) && a.$$typeof !== b.$$typeof) {
      return false;
    }

    if (!hasOwn(b, property)) {
      return false;
    }

    if (!state.equals(a[property], b[property], property, property, a, b, state)) {
      return false;
    }

    descriptorA = getOwnPropertyDescriptor(a, property);
    descriptorB = getOwnPropertyDescriptor(b, property);

    if (
      (descriptorA || descriptorB) &&
      (!descriptorA ||
        !descriptorB ||
        descriptorA.configurable !== descriptorB.configurable ||
        descriptorA.enumerable !== descriptorB.enumerable ||
        descriptorA.writable !== descriptorB.writable)
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Whether the primitive wrappers passed are equal in value.
 */
function arePrimitiveWrappersEqualDefault(
  a: PrimitiveWrapper,
  b: PrimitiveWrapper,
): boolean {
  return sameValueZeroEqual(a.valueOf(), b.valueOf());
}

/**
 * Whether the regexps passed are equal in value.
 */
function areRegExpsEqualDefault(a: RegExp, b: RegExp): boolean {
  return a.source === b.source && a.flags === b.flags;
}

/**
 * Whether the `Set`s are equal in value.
 */
function areSetsEqualDefault(a: Set<any>, b: Set<any>, state: State<any>): boolean {
  if (a.size !== b.size) {
    return false;
  }

  const matchedIndices: Record<number, true> = {};
  const aIterable = a.values();

  let aResult: IteratorResult<any>;
  let bResult: IteratorResult<any>;

  while ((aResult = aIterable.next())) {
    if (aResult.done) {
      break;
    }

    const bIterable = b.values();

    let hasMatch = false;
    let matchIndex = 0;

    while ((bResult = bIterable.next())) {
      if (bResult.done) {
        break;
      }

      if (
        !hasMatch &&
        !matchedIndices[matchIndex] &&
        (hasMatch = state.equals(
          aResult.value,
          bResult.value,
          aResult.value,
          bResult.value,
          a,
          b,
          state,
        ))
      ) {
        matchedIndices[matchIndex] = true;
      }

      matchIndex++;
    }

    if (!hasMatch) {
      return false;
    }
  }

  return true;
}

/**
 * Whether the TypedArray instances are equal in value.
 */
function areTypedArraysEqual(a: TypedArray, b: TypedArray) {
  let index = a.length;

  if (b.length !== index) {
    return false;
  }

  while (index-- > 0) {
    if (a[index] !== b[index]) {
      return false;
    }
  }

  return true;
}

const ARGUMENTS_TAG = '[object Arguments]';
const BOOLEAN_TAG = '[object Boolean]';
const DATE_TAG = '[object Date]';
const MAP_TAG = '[object Map]';
const NUMBER_TAG = '[object Number]';
const OBJECT_TAG = '[object Object]';
const REG_EXP_TAG = '[object RegExp]';
const SET_TAG = '[object Set]';
const STRING_TAG = '[object String]';

const { isArray } = Array;
const isTypedArray =
  typeof ArrayBuffer === 'function' && ArrayBuffer.isView ? ArrayBuffer.isView : null;
const { assign } = Object;
const getTag = Object.prototype.toString.call.bind(Object.prototype.toString) as (
  a: object,
) => string;

interface CreateIsEqualOptions<Meta> {
  circular: boolean;
  comparator: EqualityComparator<Meta>;
  createState: CreateState<Meta> | undefined;
  equals: InternalEqualityComparator<Meta>;
  strict: boolean;
}

/**
 * Create a comparator method based on the type-specific equality comparators passed.
 */
function createEqualityComparator<Meta>({
  areArraysEqual,
  areDatesEqual,
  areMapsEqual,
  areObjectsEqual,
  arePrimitiveWrappersEqual,
  areRegExpsEqual,
  areSetsEqual,
  areTypedArraysEqual,
}: ComparatorConfig<Meta>): EqualityComparator<Meta> {
  /**
   * compare the value of the two objects and return true if they are equivalent in values
   */
  return function comparator(a: any, b: any, state: State<Meta>): boolean {
    // If the items are strictly equal, no need to do a value comparison.
    if (a === b) {
      return true;
    }

    // If the items are not non-nullish objects, then the only possibility
    // of them being equal but not strictly is if they are both `NaN`. Since
    // `NaN` is uniquely not equal to itself, we can use self-comparison of
    // both objects, which is faster than `isNaN()`.
    if (a == null || b == null || typeof a !== 'object' || typeof b !== 'object') {
      return a !== a && b !== b;
    }

    const constructor = a.constructor;

    // Checks are listed in order of commonality of use-case:
    //   1. Common complex object types (plain object, array)
    //   2. Common data values (date, regexp)
    //   3. Less-common complex object types (map, set)
    //   4. Less-common data values (promise, primitive wrappers)
    // Inherently this is both subjective and assumptive, however
    // when reviewing comparable libraries in the wild this order
    // appears to be generally consistent.

    // Constructors should match, otherwise there is potential for false positives
    // between class and subclass or custom object and POJO.
    if (constructor !== b.constructor) {
      return false;
    }

    // `isPlainObject` only checks against the object's own realm. Cross-realm
    // comparisons are rare, and will be handled in the ultimate fallback, so
    // we can avoid capturing the string tag.
    if (constructor === Object) {
      return areObjectsEqual(a, b, state);
    }

    // `isArray()` works on subclasses and is cross-realm, so we can avoid capturing
    // the string tag or doing an `instanceof` check.
    if (isArray(a)) {
      return areArraysEqual(a, b, state);
    }

    // `isTypedArray()` works on all possible TypedArray classes, so we can avoid
    // capturing the string tag or comparing against all possible constructors.
    if (isTypedArray != null && isTypedArray(a)) {
      return areTypedArraysEqual(a, b, state);
    }

    // Try to fast-path equality checks for other complex object types in the
    // same realm to avoid capturing the string tag. Strict equality is used
    // instead of `instanceof` because it is more performant for the common
    // use-case. If someone is subclassing a native class, it will be handled
    // with the string tag comparison.

    if (constructor === Date) {
      return areDatesEqual(a, b, state);
    }

    if (constructor === RegExp) {
      return areRegExpsEqual(a, b, state);
    }

    if (constructor === Map) {
      return areMapsEqual(a, b, state);
    }

    if (constructor === Set) {
      return areSetsEqual(a, b, state);
    }

    // Since this is a custom object, capture the string tag to determing its type.
    // This is reasonably performant in modern environments like v8 and SpiderMonkey.
    const tag = getTag(a);

    if (tag === DATE_TAG) {
      return areDatesEqual(a, b, state);
    }

    if (tag === REG_EXP_TAG) {
      return areRegExpsEqual(a, b, state);
    }

    if (tag === MAP_TAG) {
      return areMapsEqual(a, b, state);
    }

    if (tag === SET_TAG) {
      return areSetsEqual(a, b, state);
    }

    if (tag === OBJECT_TAG) {
      // The exception for value comparison is custom `Promise`-like class instances. These should
      // be treated the same as standard `Promise` objects, which means strict equality, and if
      // it reaches this point then that strict equality comparison has already failed.
      return (
        typeof a.then !== 'function' &&
        typeof b.then !== 'function' &&
        areObjectsEqual(a, b, state)
      );
    }

    // If an arguments tag, it should be treated as a standard object.
    if (tag === ARGUMENTS_TAG) {
      return areObjectsEqual(a, b, state);
    }

    // As the penultimate fallback, check if the values passed are primitive wrappers. This
    // is very rare in modern JS, which is why it is deprioritized compared to all other object
    // types.
    if (tag === BOOLEAN_TAG || tag === NUMBER_TAG || tag === STRING_TAG) {
      return arePrimitiveWrappersEqual(a, b, state);
    }

    // If not matching any tags that require a specific type of comparison, then we hard-code false because
    // the only thing remaining is strict equality, which has already been compared. This is for a few reasons:
    //   - Certain types that cannot be introspected (e.g., `WeakMap`). For these types, this is the only
    //     comparison that can be made.
    //   - For types that can be introspected, but rarely have requirements to be compared
    //     (`ArrayBuffer`, `DataView`, etc.), the cost is avoided to prioritize the common
    //     use-cases (may be included in a future release, if requested enough).
    //   - For types that can be introspected but do not have an objective definition of what
    //     equality is (`Error`, etc.), the subjective decision is to be conservative and strictly compare.
    // In all cases, these decisions should be reevaluated based on changes to the language and
    // common development practices.
    return false;
  };
}

/**
 * Create the configuration object used for building comparators.
 */
function createEqualityComparatorConfig<Meta>({
  circular,
  createCustomConfig,
  strict,
}: CustomEqualCreatorOptions<Meta>): ComparatorConfig<Meta> {
  let config = {
    areArraysEqual: strict ? areObjectsEqualStrictDefault : areArraysEqualDefault,
    areDatesEqual: areDatesEqualDefault,
    areMapsEqual: strict
      ? combineComparators(areMapsEqualDefault, areObjectsEqualStrictDefault)
      : areMapsEqualDefault,
    areObjectsEqual: strict ? areObjectsEqualStrictDefault : areObjectsEqualDefault,
    arePrimitiveWrappersEqual: arePrimitiveWrappersEqualDefault,
    areRegExpsEqual: areRegExpsEqualDefault,
    areSetsEqual: strict
      ? combineComparators(areSetsEqualDefault, areObjectsEqualStrictDefault)
      : areSetsEqualDefault,
    areTypedArraysEqual: strict ? areObjectsEqualStrictDefault : areTypedArraysEqual,
  };

  if (createCustomConfig) {
    config = assign({}, config, createCustomConfig(config));
  }

  if (circular) {
    const areArraysEqual = createIsCircular(config.areArraysEqual);
    const areMapsEqual = createIsCircular(config.areMapsEqual);
    const areObjectsEqual = createIsCircular(config.areObjectsEqual);
    const areSetsEqual = createIsCircular(config.areSetsEqual);

    config = assign({}, config, {
      areArraysEqual,
      areMapsEqual,
      areObjectsEqual,
      areSetsEqual,
    });
  }

  return config;
}

/**
 * Default equality comparator pass-through, used as the standard `isEqual` creator for
 * use inside the built comparator.
 */
function createInternalEqualityComparator<Meta>(
  compare: EqualityComparator<Meta>,
): InternalEqualityComparator<Meta> {
  return function (
    a: any,
    b: any,
    _indexOrKeyA: any,
    _indexOrKeyB: any,
    _parentA: any,
    _parentB: any,
    state: State<Meta>,
  ) {
    return compare(a, b, state);
  };
}

/**
 * Create the `isEqual` function used by the consuming application.
 */
function createIsEqual<Meta>({ comparator, equals, strict }: CreateIsEqualOptions<Meta>) {
  const state = {
    cache: undefined,
    equals,
    meta: undefined,
    strict,
  } as State<Meta>;

  return function isEqual<A, B>(a: A, b: B): boolean {
    return comparator(a, b, state);
  };
}

/**
 * Whether the items passed are deeply-equal in value.
 */
//  const deepEqual = createCustomEqual();

const creator = () => {
  const options = {
    circular: false,
    strict: false,
  };
  const config = createEqualityComparatorConfig(options);
  const comparator = createEqualityComparator(config);
  const equals = createInternalEqualityComparator(comparator);
  return createIsEqual({
    circular: false,
    comparator,
    createState: void 0,
    equals,
    strict: false,
  });
};

export const deepEqual = creator();
