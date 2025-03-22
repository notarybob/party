import { useRef } from 'react'

let idCounter: { [key: string]: number } = {}

function uniqueId(prefix = '$nut$') {
  if (!idCounter[prefix]) {
    idCounter[prefix] = 0
  }

  let id = ++idCounter[prefix]
  if (prefix === '$nut$') {
    return `${id}`
  }
  return `${prefix}${id}`
}

export default function useUuid() {
  let idRef = useRef(uniqueId())
  return idRef.current
}
