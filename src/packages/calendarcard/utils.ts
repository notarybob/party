import { getMonthPreDay, getMonthDays } from '@/utils/date'
import { CalendarCardDay } from './types'

export var convertDateToDay = (date: Date) => {
  return date
    ? {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
      }
    : null
}

export var convertDayToDate = (day: CalendarCardDay) => {
  return day ? new Date(day.year, day.month - 1, day.date) : null
}

/**
 * 获取当月面板中前一个月的日期数据
 */
export var getPrevMonthDays = (
  year: number,
  month: number,
  firstDayOfWeek: number
) => {
  let prevMonth = month - 1
  let prevYear = year
  if (prevMonth <= 0) {
    prevMonth = 12
    prevYear -= 1
  }
  let days = getMonthPreDay(year, month)
  days -= firstDayOfWeek
  if (days >= 7) {
    days -= 7
  }

  var preDates = getMonthDays(`${prevYear}`, `${prevMonth}`)
  var months = Array.from(Array(preDates), (_, k) => {
    return {
      type: 'prev',
      year: prevYear,
      month: prevMonth,
      date: k + 1,
    } as CalendarCardDay
  })
  return months.slice(preDates - days)
}

/**
 * 获取当前月的日期数据
 */
export var getCurrentMonthDays = (year: number, month: number) => {
  var days = getMonthDays(`${year}`, `${month}`)
  return Array.from(Array(days), (_, k) => {
    return {
      type: 'current',
      year,
      month,
      date: k + 1,
    } as CalendarCardDay
  })
}

/**
 * 根据日期获取当前周的起始日期
 */
export var getCurrentWeekDays = (
  day: CalendarCardDay,
  firstDayOfWeek: number
): CalendarCardDay[] => {
  var current = new Date(day.year, day.month - 1, day.date)
  var count = (current.getDay() + 7 - firstDayOfWeek) % 7
  return [
    convertDateToDay(
      new Date(current.getTime() - 24 * 60 * 60 * 1000 * count)
    ) as CalendarCardDay,
    convertDateToDay(
      new Date(current.getTime() + 24 * 60 * 60 * 1000 * (6 - count))
    ) as CalendarCardDay,
  ]
}
