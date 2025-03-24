import React from 'react'
import { GridItemProps } from '../griditem/griditem.taro'

let gridContext = {
  onClick: (item: GridItemProps, index: number) => {},
}

export default React.createContext(gridContext)
