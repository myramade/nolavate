export const getFormattedDate = () => {
  return new Date().toISOString();
};

export const formatDate = (date, format = 'ISO') => {
  const d = new Date(date);
  if (format === 'ISO') {
    return d.toISOString();
  }
  return d.toString();
};
