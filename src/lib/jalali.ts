import jalaali from "jalaali-js";

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

const PERSIAN_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

/** Formats a Date as a Persian (Jalali) calendar date string, e.g. "۱۵ مهر ۱۴۰۴". */
export function formatJalali(date: Date): string {
  const { jy, jm, jd } = jalaali.toJalaali(date);
  return toPersianDigits(`${jd} ${PERSIAN_MONTHS[jm - 1]} ${jy}`);
}

export function formatJalaliDateTime(date: Date): string {
  const datePart = formatJalali(date);
  const time = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  return `${datePart} - ${toPersianDigits(time)}`;
}
