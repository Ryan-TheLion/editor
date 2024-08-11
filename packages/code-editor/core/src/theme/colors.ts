export interface CodeEditorThemeColors {
  editor: {
    bg: string
    font: string
    activeLine: string
    selection: string
    gutter: {
      bg: string
      font: string
    }
    cursor: string
    scrollbar: {
      vertical: {
        track: {
          bg: string
          border: string
        }
        thumb: string
      }
      horizontal: {
        track: {
          bg: string
          border: string
        }
        thumb: string
      }
    }
  }
  highlight: {
    comment: string
    definition: string
    functionName: string
    keyword: string
    typeName: string
    bool: string
    string: string
    matchingBracket: string
  }
}

export const codeEditorLightThemeColors: CodeEditorThemeColors = {
  editor: {
    bg: '#FCFCFC',
    font: '#333333',
    activeLine: '#DEDEDE4D',
    selection: '#B2D9FF',
    gutter: {
      bg: '#FCFCFC',
      font: '#333333',
    },
    cursor: '#000',
    scrollbar: {
      vertical: {
        track: {
          bg: '#FCFCFC',
          border: '#F4F5F6',
        },
        thumb: '#797979',
      },
      horizontal: {
        track: {
          bg: 'transparent',
          border: 'transparent',
        },
        thumb: '#797979',
      },
    },
  },
  highlight: {
    comment: '#98999c',
    definition: '#333333',
    functionName: '#9E7E51',
    keyword: '#517ECB',
    typeName: '#517ECB',
    bool: '#99C5D7',
    string: '#C89968',
    matchingBracket: '#328c8252',
  },
}

export const codeEditorDarkThemeColors: CodeEditorThemeColors = {
  editor: {
    bg: '#1C2333',
    font: '#F5F9FC',
    activeLine: '#0041824D',
    selection: '#004182',
    gutter: {
      bg: '#1C2333',
      font: '#CCCCCC',
    },
    cursor: '#fff',
    scrollbar: {
      vertical: {
        track: {
          bg: '#1C2333',
          border: '#2B3245',
        },
        thumb: '#797979',
      },
      horizontal: {
        track: {
          bg: 'transparent',
          border: 'transparent',
        },
        thumb: '#797979',
      },
    },
  },
  highlight: {
    comment: '#078A1D',
    definition: '#F5F9FC',
    functionName: '#DBCC7F',
    keyword: '#57ABFF',
    typeName: '#57ABFF',
    bool: '#99C5D7',
    string: '#EF9854',
    matchingBracket: '#e0e0e080',
  },
}
