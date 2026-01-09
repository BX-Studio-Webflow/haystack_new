export function debounce(func: (...args: any[]) => void, delay: number) {
  let debounceTimer: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: any[]) {
    const context = this;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(context, args), delay);
  };
}

// Function for querying a single element by selector
export function qs<T extends HTMLElement = HTMLDivElement>(
  selector: string
): T {
  return document.querySelector(selector) as T;
}

// Function for querying multiple elements by selector
export function qsa<T extends HTMLElement = HTMLDivElement>(
  selector: string
): NodeListOf<T> {
  return document.querySelectorAll(selector) as NodeListOf<T>;
}

export function formatCuratedDate(inputDate: Date) {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const date = new Date(inputDate);
  const month = date.getUTCMonth();
  const year = date.getUTCFullYear();
  const day = date.getUTCDate();
  return `${months[month]} ${day.toString().padStart(2, "0")}, ${year}`;
}
export function toSentenceCase(str: string) {
  if (!str) return "";
  str = str.toLowerCase();
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function toTitleCase(str: string) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD") // Normalize accented characters
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, "") // Remove non-alphanumeric characters
    .trim() // Remove leading/trailing whitespace
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with dashes
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing dashes
}
