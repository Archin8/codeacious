// Local calendar date as YYYY-MM-DD. Do NOT use toISOString(): it's UTC and shifts day near midnight.
export const todayLocal = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 'T00:00:00' with no 'Z' parses as local midnight, keeping the displayed day exact.
export const formatEntryDate = (iso) => {
  if (!iso) return '';
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
