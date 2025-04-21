export const getInitials = (name: string): string => {
  const names = name.split(" ");
  const firstname = names[0];
  const secondname = names.length >= 2 ? names[1] : "";
  const initials = secondname
    ? firstname[0] + secondname[0]
    : firstname
      ? firstname[0]
      : "N/A";
  return initials;
};
