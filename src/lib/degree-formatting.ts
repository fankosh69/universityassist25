/**
 * Converts degree type strings to their proper abbreviated forms
 */
export function formatDegreeType(degreeType: string): string {
  const degree = degreeType?.toLowerCase();
  
  switch (degree) {
    case 'master':
    case 'master of science':
      return 'M.Sc.';
    case 'master of arts':
      return 'M.A.';
    case 'master of engineering':
      return 'M.Eng.';
    case 'master of business administration':
      return 'M.B.A.';
    case 'bachelor':
    case 'bachelor of science':
      return 'B.Sc.';
    case 'bachelor of arts':
      return 'B.A.';
    case 'bachelor of engineering':
      return 'B.Eng.';
    default:
      return degreeType?.charAt(0).toUpperCase() + degreeType?.slice(1).toLowerCase() || '';
  }
}

/**
 * Formats the complete program title: "Degree Type in Program Name"
 */
export function formatProgramTitle(degreeType: string, programName: string): string {
  const formattedDegree = formatDegreeType(degreeType);
  return `${formattedDegree} in ${programName}`;
}