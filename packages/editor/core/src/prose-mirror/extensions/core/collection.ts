import { AnyExtension, PascalToSnakeCase, SnakeToPascalCase } from '../../../typing'
import { snakeToPascal } from '../../utils'

export type ExtensionCollectionMap<
  E extends AnyExtension,
  PascalCaseName extends string = SnakeToPascalCase<E['name']>,
> = {
  [K in PascalCaseName]: Array<E>[number] extends { name: PascalToSnakeCase<K> }
    ? Array<E>[number]
    : never
}

export type ReferenceReturnType<
  E extends AnyExtension,
  Key extends SnakeToPascalCase<E['name']>,
> = ExtensionCollectionMap<E>[Key]

export type ExtensionCollectionFactory<E extends AnyExtension = AnyExtension> = (
  ...args: any[]
) => E[]

/**
 * 관련있는 extension을 모아서 하나의 extension kit 처럼 이용할 수 있도록 도와 줌
 * - 인스턴스는 배열 타입
 * - extensions 필드
 * - name이 string 타입일 경우 좁혀서 추론할 수 없어,
 * `as const` 등을 활용해 name이 snake_case의 문자 리터럴 타입(ex. `"table_cell"`)이 될 수 있도록 해야
 * 자동완성을 활용할 수 있음
 *
 * **from**
 * - collection 클래스 인스턴스를 생성
 * - static 메소드
 *
 * **extensions**
 * - extension.name 의 PascalCase를 key로 가지는 extension 객체
 *
 * **reference**
 * - collection 특정 extension의 commands 등이 필요할 경우,
 * 추가로 import하지 않고 해당 메소드를 통해 접근 가능
 * - extensions[key] 로 접근하는 것과 동일함
 *
 * @example
 * ```ts
 * // create
 * const List = ExtensionCollection.from([ListItem, OrderedList, BulletList])
 *
 * // get
 * // PascalCaseKey가 자동 완성되어 추천 됨
 * // 값의 타입은 extension 에 명시한 타입
 * List.extensions.BulletList
 * List.reference('BulletList')
 * ```
 */
export class ExtensionCollection<E extends AnyExtension> extends Array<E> {
  #extensions!: ExtensionCollectionMap<E>

  private constructor(extensions: E[], options?: any) {
    /*
      - immutable (원본 수정 X) 하도록 하기 위해 proxy, object.freeze, private field & getter 활용

      - 인스턴스 배열에서 map, concat 등 빌트인 배열(Array)의 prototype 메소드(함수)를 호출할 경우
      생성자를 호출하고 array 의 길이(number)를 인자로 전달하기 때문에

      1) ExtensionCollection.from 으로 생성
         (유효한 extensions 배열을 가지고 생성)
         - 생성 이후 인스턴스는 배열이고,
           ExtensionCollection의 메소드와 필드를 가지고 있음
      2) 빌트인 배열 메소드로 인해 생성자가 내부적으로 호출되어 생성
         (유효한 extensions 배열을 가지지 않고 생성)
         - 생성 이후 인스턴스는 배열이고,
           ExtensionCollection의 메소드나 필드는 없음

      2가지 경우를 고려하여 구현
    */

    const extensionsIsNumber = typeof extensions === 'number'

    if (extensionsIsNumber) {
      super(extensions)
    } else {
      super(...Array.from(extensions))
    }

    if (!extensionsIsNumber) {
      this.#extensions = extensions.reduce((_extensions, extension) => {
        return {
          ..._extensions,
          [snakeToPascal(extension.name)]: extension,
        }
      }, {} as ExtensionCollectionMap<E>)

      Object.freeze(this.#extensions)
    }

    const proxy = new Proxy(this, {
      get: (target, p, receiver) => {
        if (p === 'extensions') {
          return target.#extensions
        }

        return Reflect.get(target, p, receiver)
      },
      set: (target, p, value, receiver) => {
        if (p === 'extensions') {
          throw new Error('extensions 필드를 수정할 수 없습니다.')
        }

        if (typeof p === 'symbol' || isNaN(Number(p))) {
          return Reflect.set(target, p, value, receiver)
        }

        throw new Error('원본 배열을 수정할 수 없습니다.')
      },
    })

    return proxy
  }

  reference<Key extends SnakeToPascalCase<E['name']>>(key: Key): ReferenceReturnType<E, Key> {
    return this.extensions[key]
  }

  get extensions() {
    return this.#extensions
  }

  static from<E extends AnyExtension>(extensions: E[]) {
    return new ExtensionCollection<E>(extensions)
  }
}
