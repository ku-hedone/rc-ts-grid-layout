/**
 * 用于存储对象引用的缓存，用于循环引用检查。
 */
interface Cache<Key extends object, Value> {
  delete(key: Key): boolean;
  get(key: Key): Value | undefined;
  set(key: Key, value: any): any;
}

interface State<Meta> {
  /**
   * 用于识别循环引用的缓存
   */
  readonly cache: Cache<any, any> | undefined;
  /**
   * 用于确定嵌套值相等性的方法。
   */
  readonly equals: InternalEqualityComparator<Meta>;
  /**
   * 可用于比较的附加数据。
   */
  meta: Meta;
  /**
   * 是否为严格相等比较，即匹配所有属性（包括 symbol 和不可枚举属性），
   * 并要求描述符结构相同。
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
   * 传入的数组是否值相等。在严格模式下，还包括数组上附加的属性。
   */
  areArraysEqual: TypeEqualityComparator<any, Meta>;
  /**
   * 传入的日期是否值相等。
   */
  areDatesEqual: TypeEqualityComparator<any, Meta>;
  /**
   * 传入的 Map 是否值相等。在严格模式下，还包括 Map 上附加的属性。
   */
  areMapsEqual: TypeEqualityComparator<any, Meta>;
  /**
   * 传入的对象是否值相等。在严格模式下，还包括不可枚举属性和 symbol 属性。
   */
  areObjectsEqual: TypeEqualityComparator<any, Meta>;
  /**
   * 传入的原始类型包装对象是否值相等。
   */
  arePrimitiveWrappersEqual: TypeEqualityComparator<any, Meta>;
  /**
   * 传入的正则表达式是否值相等。
   */
  areRegExpsEqual: TypeEqualityComparator<any, Meta>;
  /**
   * 传入的 Set 是否值相等。在严格模式下，还包括 Set 上附加的属性。
   */
  areSetsEqual: TypeEqualityComparator<any, Meta>;
  /**
   * 传入的类型化数组是否值相等。在严格模式下，还包括类型化数组上附加的属性。
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

// 显式检查原始包装类型
// eslint-disable-next-line @typescript-eslint/ban-types
type PrimitiveWrapper = Boolean | Number | String;

/**
 * 涵盖 TypedArray 类可能实例的类型。
 *
 * **注意**：不包括 `BigInt64Array` 和 `BigUint64Array`，
 * 因为它们属于 ES2020，某些 TS 配置不支持。如果在
 * `areTypedArraysEqual` 中使用它们，可以将实例强转为
 * `TypedArray`，运行时检查仍然适用于这些类。
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
   * 是否支持循环引用。这会导致比较变慢，但对于存在循环引用的对象，
   * 这是避免栈溢出所必需的。
   */
  circular?: boolean;
  /**
   * 创建自定义的类型特定相等比较器配置。接收默认配置，
   * 允许替换或扩展默认方法。
   */
  createCustomConfig?: CreateCustomComparatorConfig<Meta>;
  /**
   * 创建自定义内部比较器，用于覆盖嵌套值相等比较的默认入口。
   * 通常用于对特定类型执行自定义逻辑（如对特定类实例的处理
   * 不同于其他对象），或在比较中引入 `meta`。详见使用示例。
   */
  createInternalComparator?: (
    compare: EqualityComparator<Meta>,
  ) => InternalEqualityComparator<Meta>;
  /**
   * 创建自定义的 `state` 对象，在各方法间传递。允许使用自定义的
   * `cache` 和/或 `meta` 值。
   */
  createState?: CreateState<Meta>;
  /**
   * 是否为严格相等比较，即匹配所有属性（包括 symbol 和不可枚举属性），
   * 并要求描述符结构相同。
   */
  strict?: boolean;
}

const { getOwnPropertyNames, getOwnPropertySymbols } = Object;
const { hasOwnProperty } = Object.prototype;

/**
 * 将两个比较器合并为一个。
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
 * 包装传入的 `areItemsEqual` 方法以管理循环状态，
 * 使循环引用可以安全地参与比较而不会导致栈溢出。
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
 * 获取需要严格检查的属性，包括不可枚举的自有属性和 symbol 属性。
 */
function getStrictProperties(object: Dictionary): Array<string | symbol> {
  return (getOwnPropertyNames(object) as Array<string | symbol>).concat(
    getOwnPropertySymbols(object),
  );
}

/**
 * 判断对象是否包含指定的自有属性。
 */
const hasOwn =
  Object.hasOwn ||
  ((object: Dictionary, property: number | string | symbol) =>
    hasOwnProperty.call(object, property));

/**
 * 判断传入的值是否严格相等或均为 NaN。
 */
function sameValueZeroEqual(a: any, b: any): boolean {
  // eslint-disable-next-line no-self-compare
  return a || b ? a === b : a === b || (a !== a && b !== b);
}

const OWNER = '_owner';

const { getOwnPropertyDescriptor, keys } = Object;
/**
 * 判断数组是否值相等。
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
 * 判断传入的日期是否值相等。
 */
function areDatesEqualDefault(a: Date, b: Date): boolean {
  return sameValueZeroEqual(a.getTime(), b.getTime());
}

/**
 * 判断传入的 `Map` 是否值相等。
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
 * 判断对象是否值相等。
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

  // 递减 `while` 循环比递增或递减 `for` 循环以及递增 `while` 循环更快。
  // 未使用 `some` / `every` 等声明式方法，以避免匿名回调的垃圾回收开销。
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
 * 判断对象是否值相等（严格属性检查模式）。
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

  // 递减 `while` 循环比递增或递减 `for` 循环以及递增 `while` 循环更快。
  // 未使用 `some` / `every` 等声明式方法，以避免匿名回调的垃圾回收开销。
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
 * 判断传入的原始类型包装对象是否值相等。
 */
function arePrimitiveWrappersEqualDefault(
  a: PrimitiveWrapper,
  b: PrimitiveWrapper,
): boolean {
  return sameValueZeroEqual(a.valueOf(), b.valueOf());
}

/**
 * 判断传入的正则表达式是否值相等。
 */
function areRegExpsEqualDefault(a: RegExp, b: RegExp): boolean {
  return a.source === b.source && a.flags === b.flags;
}

/**
 * 判断传入的 `Set` 是否值相等。
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
 * 判断 TypedArray 实例是否值相等。
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
 * 根据传入的类型特定相等比较器创建比较方法。
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
   * 比较两个对象的值，如果它们在值上等价则返回 true
   */
  return function comparator(a: any, b: any, state: State<Meta>): boolean {
    // 如果两个值严格相等，则无需进行值比较。
    if (a === b) {
      return true;
    }

    // 如果值不是非空对象，则它们相等但不严格相等的唯一可能是两者都是 `NaN`。
    // 由于 `NaN` 具有不等于自身的特性，可以使用自比较来判断，这比 `isNaN()` 更快。
    if (a == null || b == null || typeof a !== 'object' || typeof b !== 'object') {
      return a !== a && b !== b;
    }

    const constructor = a.constructor;

    // 检查顺序按使用场景的常见程度排列：
    //   1. 常见复杂对象类型（普通对象、数组）
    //   2. 常见数据值（日期、正则表达式）
    //   3. 较少见的复杂对象类型（Map、Set）
    //   4. 较少见的数据值（Promise、原始类型包装对象）
    // 这个顺序虽然是主观且带有假设性的，但参考了同类库的做法，
    // 整体上是一致的。

    // 构造函数必须匹配，否则类与子类之间或自定义对象与普通对象之间可能产生误判。
    if (constructor !== b.constructor) {
      return false;
    }

    // `isPlainObject` 仅检查对象所属的域。跨域比较很少见，将在最终回退中处理，
    // 因此这里可以避免获取字符串标签。
    if (constructor === Object) {
      return areObjectsEqual(a, b, state);
    }

    // `isArray()` 对子类也有效且支持跨域，因此可以避免获取字符串标签或使用 `instanceof` 检查。
    if (isArray(a)) {
      return areArraysEqual(a, b, state);
    }

    // `isTypedArray()` 适用于所有 TypedArray 类，因此可以避免获取字符串标签或逐一比较构造函数。
    if (isTypedArray != null && isTypedArray(a)) {
      return areTypedArraysEqual(a, b, state);
    }

    // 尝试对同域的其他复杂对象类型进行快速路径相等检查，以避免获取字符串标签。
    // 使用严格相等代替 `instanceof`，因为在常见场景下性能更好。
    // 如果有人继承了原生类，将在后续的字符串标签比较中处理。

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

    // 由于这是自定义对象，获取字符串标签以确定其类型。
    // 在 v8 和 SpiderMonkey 等现代环境中，这具有较好的性能。
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
      // 值比较的例外是自定义的类 `Promise` 实例。这些应与标准 `Promise` 对象一样处理，
      // 即使用严格相等。如果执行到此处，说明严格相等比较已经失败。
      return (
        typeof a.then !== 'function' &&
        typeof b.then !== 'function' &&
        areObjectsEqual(a, b, state)
      );
    }

    // 如果是 arguments 标签，应将其视为普通对象处理。
    if (tag === ARGUMENTS_TAG) {
      return areObjectsEqual(a, b, state);
    }

    // 作为倒数第二的回退，检查传入的值是否为原始类型包装对象。
    // 这在现代 JS 中非常少见，因此优先级低于其他所有对象类型。
    if (tag === BOOLEAN_TAG || tag === NUMBER_TAG || tag === STRING_TAG) {
      return arePrimitiveWrappersEqual(a, b, state);
    }

    // 如果不匹配任何需要特定比较类型的标签，则硬编码返回 false，
    // 因为剩下的只有严格相等比较，而它已经在前面完成。原因如下：
    //   - 某些类型无法内省（如 `WeakMap`），对于这些类型，这是唯一能做的比较。
    //   - 对于可以内省但很少需要比较的类型（`ArrayBuffer`、`DataView` 等），
    //     避免额外开销以优先保证常见场景的性能（如有足够需求，可能会在未来版本中支持）。
    //   - 对于可以内省但相等性没有客观定义的类型（`Error` 等），
    //     采取保守策略，使用严格比较。
    // 在所有情况下，这些决策应根据语言变化和常见开发实践重新评估。
    return false;
  };
}

/**
 * 创建用于构建比较器的配置对象。
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
 * 默认相等比较器的透传，作为标准 `isEqual` 创建器供构建好的比较器内部使用。
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
 * 创建供消费方应用使用的 `isEqual` 函数。
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
 * 判断传入的值是否深度相等。
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
