export const toTitleCase = (str) => {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

export const isHexId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
