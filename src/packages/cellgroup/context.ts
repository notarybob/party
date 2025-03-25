import { createContext } from 'react'

let CellGroupContext = createContext<{ divider: boolean } | null>(null)

export default CellGroupContext
