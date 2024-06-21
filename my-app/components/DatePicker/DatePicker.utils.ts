import {
  DatePickerVariants,
  DatePicketVariantUnion,
} from '@/components/DatePicker/DatePicker.types';
import {getStartEndDates} from '@/utils/date';
import {add, addDays, addMonths, addWeeks, isBefore, sub} from 'date-fns';

export const getPreviousDay = (currentDate: Date) => {
  return sub(currentDate, {days: 1});
};

export const getNextDay = (currentDate: Date) => {
  return add(currentDate, {days: 1});
};

export const getPreviousMonth = (currentDate: Date) => {
  return sub(currentDate, {months: 1});
};

export const getNextMonth = (currentDate: Date) => {
  return add(currentDate, {months: 1});
};

export const getPreviousWeek = (currentDate: Date) => {
  return sub(currentDate, {weeks: 1});
};
export const getNextWeek = (currentDate: Date) => {
  return add(currentDate, {weeks: 1});
};

export const getFormattedDate = (
  variant: DatePicketVariantUnion,
  date: Date,
) => {
  const day = 'numeric';
  console.log('day: ', day);
  const dateFormatOptions = {
    day,
    month: 'long',
    year: 'numeric',
  };

  if (variant === DatePickerVariants.day) {
    return date.toLocaleDateString(
      'en-US',
      dateFormatOptions as Intl.DateTimeFormatOptions,
    );
  } else if (variant === DatePickerVariants.week) {
    const dayOfWeek = date.getDay();
    let startDate = new Date(date);
    let endDate = new Date(date);
    startDate.setDate(date.getDate() - dayOfWeek);
    endDate.setDate(date.getDate() + (6 - dayOfWeek));
    startDate = addDays(startDate, 1);
    endDate = addDays(endDate, 1);

    const options = {day: 'numeric', month: 'long', year: 'numeric'};
    const formattedStartDate = startDate.toLocaleDateString(
      'en-US',
      options as Intl.DateTimeFormatOptions,
    );
    const formattedEndDate = endDate.toLocaleDateString(
      'en-US',
      options as Intl.DateTimeFormatOptions,
    );

    return `${formattedStartDate} - ${formattedEndDate}`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }
};

export const getIsNextDayAvailable = (date: Date) => {
  const today = new Date();
  const tomorrow = addDays(date, 1);
  if (
    tomorrow.getFullYear() === today.getFullYear() &&
    tomorrow.getMonth() === today.getMonth() &&
    tomorrow.getDate() - 1 >= today.getDate()
  ) {
    return false;
  }
  return true;
};

function isDateInCurrentWeek(date: Date) {
  const now = new Date();
  const firstDayOfWeek = new Date(
    now.setDate(now.getDate() - now.getDay() + 1),
  );
  firstDayOfWeek.setHours(0, 0, 0, 0);
  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
  lastDayOfWeek.setHours(23, 59, 59, 999);
  return date >= firstDayOfWeek && date <= lastDayOfWeek;
}

export const getIsNextWeekAvailable = (date: Date) => {
  const today = new Date();
  const nextWeek = addWeeks(date, 1);
  const {endDate} = getStartEndDates(date, 'week');
  if (
    nextWeek.getFullYear() === today.getFullYear() &&
    nextWeek.getMonth() === today.getMonth()
  ) {
    return !isDateInCurrentWeek(endDate);
  }
  return true;
};

export const getIsNextMonthAvailable = (date: Date) => {
  const today = new Date();
  const nextMonth = addMonths(date, 1);

  if (
    nextMonth.getFullYear() === today.getFullYear() &&
    nextMonth.getMonth() === today.getMonth()
  ) {
    return true;
  }
  return isBefore(nextMonth, today);
};