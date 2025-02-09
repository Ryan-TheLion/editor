export const pascalToSnake = (PascalCase: string) => {
  return PascalCase.replace(/([A-Z])/g, '_$1') // 대문자 앞에 '_'를 추가
    .toLowerCase() // 모두 소문자로 변환
    .replace(/^_/, '') // 문자열 맨 앞에 붙은 '_' 제거
}

export const snakeToPascal = (snake_case: string) => {
  return snake_case
    .replace(/^[a-z]/, (match) => match.toUpperCase()) // 문자열 첫 문자를 대문자로 변환
    .replace(/(?<=_)[a-z]/g, (match) => match.toUpperCase()) // '_'뒤에 있는 소문자를 대문자로 변환
    .replace('_', '') // '_' 제거
}

export const upperCaseFirst = (str: string) => {
  return str.replace(/^[a-z]/, (match) => match.toUpperCase())
}

export const lowerCaseFirst = (str: string) => {
  return str.replace(/^[A-Z]/, (match) => match.toLowerCase())
}

export const extractFunctionBody = (fn: Function) => {
  const body = fn.toString().match(/{([\s\S]*)}/)

  if (!body) {
    return ''
  }

  return body[1] ?? ''
}

export const minifySpace = (str: string) => {
  return str
    .trim()
    .split('\n')
    .map((v) => v.trim())
    .join('')
}
