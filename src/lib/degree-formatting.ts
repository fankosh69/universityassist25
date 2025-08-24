/**
 * Converts degree type strings to their proper abbreviated forms
 */
export function formatDegreeType(degreeType: string): string {
  const degree = degreeType?.toLowerCase();
  
  switch (degree) {
    case 'master':
    case 'master of science':
    case 'm.sc.':
    case 'msc':
      return 'M.Sc.';
    case 'master of arts':
    case 'm.a.':
    case 'ma':
      return 'M.A.';
    case 'master of engineering':
    case 'm.eng.':
    case 'meng':
      return 'M.Eng.';
    case 'master of business administration':
    case 'm.b.a.':
    case 'mba':
      return 'M.B.A.';
    case 'bachelor':
    case 'bachelor of science':
    case 'b.sc.':
    case 'bsc':
      return 'B.Sc.';
    case 'bachelor of arts':
    case 'b.a.':
    case 'ba':
      return 'B.A.';
    case 'bachelor of engineering':
    case 'b.eng.':
    case 'beng':
      return 'B.Eng.';
    default:
      // Handle other formats like "B.A.", "M.Sc." properly
      if (degree?.match(/^[bm]\.[a-z]+\.?$/)) {
        return degree.toUpperCase().replace(/\.$/, '') + '.';
      }
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