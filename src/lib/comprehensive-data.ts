/**
 * Comprehensive German University Data
 * All cities with universities and all universities in Germany
 */

export const GERMAN_CITIES_WITH_UNIVERSITIES = [
  // Major Cities (Population > 500k)
  { id: 'berlin', name: 'Berlin', state: 'Berlin', lat: 52.5200, lng: 13.4050, population: 3669491 },
  { id: 'hamburg', name: 'Hamburg', state: 'Hamburg', lat: 53.5511, lng: 9.9937, population: 1899160 },
  { id: 'munich', name: 'Munich', state: 'Bavaria', lat: 48.1351, lng: 11.5820, population: 1488202 },
  { id: 'cologne', name: 'Cologne', state: 'North Rhine-Westphalia', lat: 50.9375, lng: 6.9603, population: 1073096 },
  { id: 'frankfurt', name: 'Frankfurt am Main', state: 'Hesse', lat: 50.1109, lng: 8.6821, population: 753056 },
  { id: 'stuttgart', name: 'Stuttgart', state: 'Baden-Württemberg', lat: 48.7758, lng: 9.1829, population: 626275 },
  { id: 'dusseldorf', name: 'Düsseldorf', state: 'North Rhine-Westphalia', lat: 51.2277, lng: 6.7735, population: 619294 },
  { id: 'leipzig', name: 'Leipzig', state: 'Saxony', lat: 51.3397, lng: 12.3731, population: 597493 },
  { id: 'dortmund', name: 'Dortmund', state: 'North Rhine-Westphalia', lat: 51.5136, lng: 7.4653, population: 588250 },
  { id: 'essen', name: 'Essen', state: 'North Rhine-Westphalia', lat: 51.4556, lng: 7.0116, population: 579432 },
  
  // Large Cities (Population 200k-500k)
  { id: 'bremen', name: 'Bremen', state: 'Bremen', lat: 53.0793, lng: 8.8017, population: 567559 },
  { id: 'dresden', name: 'Dresden', state: 'Saxony', lat: 51.0504, lng: 13.7373, population: 556780 },
  { id: 'hanover', name: 'Hanover', state: 'Lower Saxony', lat: 52.3759, lng: 9.7320, population: 538068 },
  { id: 'nuremberg', name: 'Nuremberg', state: 'Bavaria', lat: 49.4521, lng: 11.0767, population: 518365 },
  { id: 'duisburg', name: 'Duisburg', state: 'North Rhine-Westphalia', lat: 51.4344, lng: 6.7623, population: 498590 },
  { id: 'bochum', name: 'Bochum', state: 'North Rhine-Westphalia', lat: 51.4818, lng: 7.2162, population: 364454 },
  { id: 'wuppertal', name: 'Wuppertal', state: 'North Rhine-Westphalia', lat: 51.2562, lng: 7.1508, population: 354382 },
  { id: 'bielefeld', name: 'Bielefeld', state: 'North Rhine-Westphalia', lat: 52.0202, lng: 8.5353, population: 334002 },
  { id: 'bonn', name: 'Bonn', state: 'North Rhine-Westphalia', lat: 50.7374, lng: 7.0982, population: 327258 },
  { id: 'munster', name: 'Münster', state: 'North Rhine-Westphalia', lat: 51.9607, lng: 7.6261, population: 315293 },
  
  // Medium Cities (Population 100k-200k)
  { id: 'karlsruhe', name: 'Karlsruhe', state: 'Baden-Württemberg', lat: 49.0069, lng: 8.4037, population: 308436 },
  { id: 'mannheim', name: 'Mannheim', state: 'Baden-Württemberg', lat: 49.4875, lng: 8.4660, population: 307960 },
  { id: 'augsburg', name: 'Augsburg', state: 'Bavaria', lat: 48.3705, lng: 10.8978, population: 295135 },
  { id: 'wiesbaden', name: 'Wiesbaden', state: 'Hesse', lat: 50.0782, lng: 8.2398, population: 278342 },
  { id: 'gelsenkirchen', name: 'Gelsenkirchen', state: 'North Rhine-Westphalia', lat: 51.5177, lng: 7.0857, population: 260654 },
  { id: 'monchengladbach', name: 'Mönchengladbach', state: 'North Rhine-Westphalia', lat: 51.1805, lng: 6.4428, population: 259996 },
  { id: 'braunschweig', name: 'Braunschweig', state: 'Lower Saxony', lat: 52.2689, lng: 10.5268, population: 248292 },
  { id: 'chemnitz', name: 'Chemnitz', state: 'Saxony', lat: 50.8278, lng: 12.9214, population: 247237 },
  { id: 'kiel', name: 'Kiel', state: 'Schleswig-Holstein', lat: 54.3233, lng: 10.1228, population: 246306 },
  { id: 'aachen', name: 'Aachen', state: 'North Rhine-Westphalia', lat: 50.7753, lng: 6.0839, population: 245885 },
  { id: 'halle', name: 'Halle (Saale)', state: 'Saxony-Anhalt', lat: 51.4825, lng: 11.9707, population: 237865 },
  { id: 'magdeburg', name: 'Magdeburg', state: 'Saxony-Anhalt', lat: 52.1205, lng: 11.6276, population: 237565 },
  { id: 'freiburg', name: 'Freiburg im Breisgau', state: 'Baden-Württemberg', lat: 47.9990, lng: 7.8421, population: 230241 },
  { id: 'krefeld', name: 'Krefeld', state: 'North Rhine-Westphalia', lat: 51.3388, lng: 6.5853, population: 227020 },
  { id: 'lubeck', name: 'Lübeck', state: 'Schleswig-Holstein', lat: 53.8655, lng: 10.6866, population: 216530 },
  { id: 'oberhausen', name: 'Oberhausen', state: 'North Rhine-Westphalia', lat: 51.4963, lng: 6.8521, population: 210829 },
  { id: 'erfurt', name: 'Erfurt', state: 'Thuringia', lat: 50.9787, lng: 11.0328, population: 213699 },
  { id: 'mainz', name: 'Mainz', state: 'Rhineland-Palatinate', lat: 49.9929, lng: 8.2473, population: 217118 },
  { id: 'rostock', name: 'Rostock', state: 'Mecklenburg-Vorpommern', lat: 54.0887, lng: 12.1430, population: 208886 },
  { id: 'kassel', name: 'Kassel', state: 'Hesse', lat: 51.3127, lng: 9.4797, population: 201048 },
  
  // University Cities (Population 50k-100k)
  { id: 'heidelberg', name: 'Heidelberg', state: 'Baden-Württemberg', lat: 49.3988, lng: 8.6724, population: 160355 },
  { id: 'darmstadt', name: 'Darmstadt', state: 'Hesse', lat: 49.8728, lng: 8.6512, population: 159631 },
  { id: 'regensburg', name: 'Regensburg', state: 'Bavaria', lat: 49.0134, lng: 12.1016, population: 152610 },
  { id: 'ingolstadt', name: 'Ingolstadt', state: 'Bavaria', lat: 48.7665, lng: 11.4257, population: 138392 },
  { id: 'wurzburg', name: 'Würzburg', state: 'Bavaria', lat: 49.7913, lng: 9.9534, population: 127934 },
  { id: 'ulm', name: 'Ulm', state: 'Baden-Württemberg', lat: 48.3984, lng: 9.9916, population: 126329 },
  { id: 'gottingen', name: 'Göttingen', state: 'Lower Saxony', lat: 51.5414, lng: 9.9155, population: 116845 },
  { id: 'pforzheim', name: 'Pforzheim', state: 'Baden-Württemberg', lat: 48.8918, lng: 8.6942, population: 125542 },
  { id: 'offenburg', name: 'Offenburg', state: 'Baden-Württemberg', lat: 48.4734, lng: 7.9443, population: 60588 },
  { id: 'konstanz', name: 'Konstanz', state: 'Baden-Württemberg', lat: 47.6779, lng: 9.1732, population: 85000 },
  { id: 'tubingen', name: 'Tübingen', state: 'Baden-Württemberg', lat: 48.5216, lng: 9.0576, population: 91506 },
  { id: 'marburg', name: 'Marburg', state: 'Hesse', lat: 50.8021, lng: 8.7667, population: 76851 },
  { id: 'giessen', name: 'Gießen', state: 'Hesse', lat: 50.5848, lng: 8.6785, population: 88029 },
  { id: 'jena', name: 'Jena', state: 'Thuringia', lat: 50.9278, lng: 11.5899, population: 111407 },
  { id: 'weimar', name: 'Weimar', state: 'Thuringia', lat: 50.9794, lng: 11.3235, population: 65098 },
  { id: 'greifswald', name: 'Greifswald', state: 'Mecklenburg-Vorpommern', lat: 54.0865, lng: 13.3923, population: 59332 },
  { id: 'oldenburg', name: 'Oldenburg', state: 'Lower Saxony', lat: 53.1435, lng: 8.2146, population: 169077 },
  { id: 'osnabruck', name: 'Osnabrück', state: 'Lower Saxony', lat: 52.2799, lng: 8.0472, population: 164748 },
  { id: 'hildesheim', name: 'Hildesheim', state: 'Lower Saxony', lat: 52.1519, lng: 9.9582, population: 101693 },
  { id: 'luneburg', name: 'Lüneburg', state: 'Lower Saxony', lat: 53.2492, lng: 10.4041, population: 75708 },
  { id: 'clausthal-zellerfeld', name: 'Clausthal-Zellerfeld', state: 'Lower Saxony', lat: 51.8094, lng: 10.3378, population: 15012 },
  { id: 'paderborn', name: 'Paderborn', state: 'North Rhine-Westphalia', lat: 51.7189, lng: 8.7575, population: 151633 },
  { id: 'siegen', name: 'Siegen', state: 'North Rhine-Westphalia', lat: 50.8747, lng: 8.0238, population: 102355 },
  { id: 'wuppertal', name: 'Wuppertal', state: 'North Rhine-Westphalia', lat: 51.2562, lng: 7.1508, population: 354382 },
  { id: 'witten', name: 'Witten', state: 'North Rhine-Westphalia', lat: 51.4387, lng: 7.3449, population: 96086 },
  { id: 'hagen', name: 'Hagen', state: 'North Rhine-Westphalia', lat: 51.3670, lng: 7.4632, population: 188687 },
  { id: 'iserlohn', name: 'Iserlohn', state: 'North Rhine-Westphalia', lat: 51.3756, lng: 7.7011, population: 92535 },
  { id: 'bocholt', name: 'Bocholt', state: 'North Rhine-Westphalia', lat: 51.8378, lng: 6.6163, population: 71311 },
  { id: 'lemgo', name: 'Lemgo', state: 'North Rhine-Westphalia', lat: 52.0276, lng: 8.9000, population: 40732 },
  { id: 'steinfurt', name: 'Steinfurt', state: 'North Rhine-Westphalia', lat: 52.1459, lng: 7.3439, population: 34637 },
  { id: 'sankt-augustin', name: 'Sankt Augustin', state: 'North Rhine-Westphalia', lat: 50.7744, lng: 7.1889, population: 56299 },
  { id: 'vallendar', name: 'Vallendar', state: 'Rhineland-Palatinate', lat: 50.4039, lng: 7.6186, population: 8800 },
  { id: 'germersheim', name: 'Germersheim', state: 'Rhineland-Palatinate', lat: 49.2175, lng: 8.3667, population: 20698 },
  { id: 'landau', name: 'Landau in der Pfalz', state: 'Rhineland-Palatinate', lat: 49.1988, lng: 8.1230, population: 47129 },
  { id: 'speyer', name: 'Speyer', state: 'Rhineland-Palatinate', lat: 49.3262, lng: 8.4312, population: 50741 },
  { id: 'trier', name: 'Trier', state: 'Rhineland-Palatinate', lat: 49.7490, lng: 6.6371, population: 111528 },
  { id: 'kaiserslautern', name: 'Kaiserslautern', state: 'Rhineland-Palatinate', lat: 49.4401, lng: 7.7491, population: 100030 },
  { id: 'koblenz', name: 'Koblenz', state: 'Rhineland-Palatinate', lat: 50.3569, lng: 7.5890, population: 113388 },
  { id: 'saarbrucken', name: 'Saarbrücken', state: 'Saarland', lat: 49.2354, lng: 6.9969, population: 180374 },
  { id: 'homburg', name: 'Homburg', state: 'Saarland', lat: 49.3217, lng: 7.3402, population: 42843 },
  { id: 'flensburg', name: 'Flensburg', state: 'Schleswig-Holstein', lat: 54.7794, lng: 9.4367, population: 89934 },
  { id: 'wedel', name: 'Wedel', state: 'Schleswig-Holstein', lat: 53.5747, lng: 9.7025, population: 33731 },
  { id: 'ilmenau', name: 'Ilmenau', state: 'Thuringia', lat: 50.6878, lng: 10.9147, population: 25901 },
  { id: 'nordhausen', name: 'Nordhausen', state: 'Thuringia', lat: 51.5020, lng: 10.7906, population: 42290 },
  { id: 'schmalkalden', name: 'Schmalkalden', state: 'Thuringia', lat: 50.7214, lng: 10.4536, population: 19442 },
  { id: 'gera', name: 'Gera', state: 'Thuringia', lat: 50.8796, lng: 12.0820, population: 93438 },
  { id: 'eichstatt', name: 'Eichstätt', state: 'Bavaria', lat: 48.8918, lng: 11.1881, population: 13814 },
  { id: 'bamberg', name: 'Bamberg', state: 'Bavaria', lat: 49.8988, lng: 10.9027, population: 77749 },
  { id: 'bayreuth', name: 'Bayreuth', state: 'Bavaria', lat: 49.9480, lng: 11.5783, population: 72148 },
  { id: 'erlangen', name: 'Erlangen', state: 'Bavaria', lat: 49.5897, lng: 11.0044, population: 112528 },
  { id: 'furtwangen', name: 'Furtwangen im Schwarzwald', state: 'Baden-Württemberg', lat: 48.0544, lng: 8.2065, population: 9151 },
  { id: 'schwabisch-gmund', name: 'Schwäbisch Gmünd', state: 'Baden-Württemberg', lat: 48.8008, lng: 9.7994, population: 60282 },
  { id: 'reutlingen', name: 'Reutlingen', state: 'Baden-Württemberg', lat: 48.4919, lng: 9.2039, population: 116456 },
  { id: 'friedrichshafen', name: 'Friedrichshafen', state: 'Baden-Württemberg', lat: 47.6540, lng: 9.4756, population: 61235 },
  { id: 'ravensburg', name: 'Ravensburg', state: 'Baden-Württemberg', lat: 47.7815, lng: 9.6128, population: 50134 },
  { id: 'albstadt', name: 'Albstadt', state: 'Baden-Württemberg', lat: 48.2190, lng: 9.0280, population: 44715 },
  { id: 'aalen', name: 'Aalen', state: 'Baden-Württemberg', lat: 48.8370, lng: 10.0933, population: 68837 },
  { id: 'heilbronn', name: 'Heilbronn', state: 'Baden-Württemberg', lat: 49.1427, lng: 9.2109, population: 126458 },
  { id: 'ludwigsburg', name: 'Ludwigsburg', state: 'Baden-Württemberg', lat: 48.8974, lng: 9.1915, population: 93482 },
  { id: 'mosbach', name: 'Mosbach', state: 'Baden-Württemberg', lat: 49.3534, lng: 9.1444, population: 23544 },
  { id: 'lorrach', name: 'Lörrach', state: 'Baden-Württemberg', lat: 47.6156, lng: 7.6612, population: 49072 },
  { id: 'villingen-schwenningen', name: 'Villingen-Schwenningen', state: 'Baden-Württemberg', lat: 48.0641, lng: 8.4614, population: 85838 },
  { id: 'passau', name: 'Passau', state: 'Bavaria', lat: 48.5665, lng: 13.4312, population: 52415 },
  { id: 'deggendorf', name: 'Deggendorf', state: 'Bavaria', lat: 48.8390, lng: 12.9605, population: 33131 },
  { id: 'landshut', name: 'Landshut', state: 'Bavaria', lat: 48.5370, lng: 12.1506, population: 73411 },
  { id: 'rosenheim', name: 'Rosenheim', state: 'Bavaria', lat: 47.8561, lng: 12.1219, population: 63551 },
  { id: 'kempten', name: 'Kempten (Allgäu)', state: 'Bavaria', lat: 47.7335, lng: 10.3157, population: 69917 },
  { id: 'neu-ulm', name: 'Neu-Ulm', state: 'Bavaria', lat: 48.3926, lng: 10.0108, population: 58724 },
  { id: 'schweinfurt', name: 'Schweinfurt', state: 'Bavaria', lat: 50.0453, lng: 10.2336, population: 53426 },
  { id: 'coburg', name: 'Coburg', state: 'Bavaria', lat: 50.2596, lng: 10.9645, population: 41249 },
  { id: 'hof', name: 'Hof', state: 'Bavaria', lat: 50.3136, lng: 11.9182, population: 45825 },
  { id: 'ansbach', name: 'Ansbach', state: 'Bavaria', lat: 49.3006, lng: 10.5714, population: 41847 },
  { id: 'aschaffenburg', name: 'Aschaffenburg', state: 'Bavaria', lat: 49.9737, lng: 9.1538, population: 71002 },
  { id: 'amberg', name: 'Amberg', state: 'Bavaria', lat: 49.4447, lng: 11.8581, population: 42350 },
  { id: 'weiden', name: 'Weiden in der Oberpfalz', state: 'Bavaria', lat: 49.6767, lng: 12.1572, population: 42743 }
];

export const GERMAN_UNIVERSITIES = [
  // Berlin Universities
  { city_id: 'berlin', name: 'Humboldt University of Berlin', type: 'Public', founded: 1810, students: 33000, ranking: 120 },
  { city_id: 'berlin', name: 'Free University of Berlin', type: 'Public', founded: 1948, students: 37000, ranking: 130 },
  { city_id: 'berlin', name: 'Technical University of Berlin', type: 'Public', founded: 1946, students: 35000, ranking: 150 },
  { city_id: 'berlin', name: 'Berlin University of the Arts', type: 'Public', founded: 1975, students: 4000, ranking: 200 },
  { city_id: 'berlin', name: 'Charité - Universitätsmedizin Berlin', type: 'Public', founded: 1710, students: 8000, ranking: 100 },
  { city_id: 'berlin', name: 'Hertie School', type: 'Private', founded: 2003, students: 600, ranking: 250 },
  { city_id: 'berlin', name: 'ESMT Berlin', type: 'Private', founded: 2002, students: 300, ranking: 300 },
  
  // Munich Universities
  { city_id: 'munich', name: 'Ludwig Maximilian University of Munich', type: 'Public', founded: 1472, students: 52000, ranking: 60 },
  { city_id: 'munich', name: 'Technical University of Munich', type: 'Public', founded: 1868, students: 45000, ranking: 50 },
  { city_id: 'munich', name: 'Munich University of Applied Sciences', type: 'Public', founded: 1971, students: 18000, ranking: 250 },
  { city_id: 'munich', name: 'Academy of Fine Arts Munich', type: 'Public', founded: 1808, students: 700, ranking: 200 },
  { city_id: 'munich', name: 'Munich Business School', type: 'Private', founded: 1991, students: 1500, ranking: 350 },
  
  // Hamburg Universities
  { city_id: 'hamburg', name: 'University of Hamburg', type: 'Public', founded: 1919, students: 43000, ranking: 200 },
  { city_id: 'hamburg', name: 'Hamburg University of Technology', type: 'Public', founded: 1978, students: 7500, ranking: 300 },
  { city_id: 'hamburg', name: 'HafenCity University Hamburg', type: 'Public', founded: 2006, students: 2500, ranking: 350 },
  { city_id: 'hamburg', name: 'Hamburg University of Applied Sciences', type: 'Public', founded: 1970, students: 17000, ranking: 280 },
  { city_id: 'hamburg', name: 'Bucerius Law School', type: 'Private', founded: 2000, students: 600, ranking: 150 },
  
  // Cologne Universities  
  { city_id: 'cologne', name: 'University of Cologne', type: 'Public', founded: 1388, students: 48000, ranking: 145 },
  { city_id: 'cologne', name: 'German Sport University Cologne', type: 'Public', founded: 1947, students: 6000, ranking: 400 },
  { city_id: 'cologne', name: 'Cologne University of Applied Sciences', type: 'Public', founded: 1971, students: 25000, ranking: 320 },
  { city_id: 'cologne', name: 'Cologne Business School', type: 'Private', founded: 1993, students: 1200, ranking: 380 },
  
  // Frankfurt Universities
  { city_id: 'frankfurt', name: 'Goethe University Frankfurt', type: 'Public', founded: 1914, students: 48000, ranking: 140 },
  { city_id: 'frankfurt', name: 'Frankfurt University of Applied Sciences', type: 'Public', founded: 1971, students: 15000, ranking: 300 },
  { city_id: 'frankfurt', name: 'Frankfurt School of Finance & Management', type: 'Private', founded: 1957, students: 2000, ranking: 200 },
  { city_id: 'frankfurt', name: 'Städel Academy', type: 'Public', founded: 1817, students: 200, ranking: 180 },
  
  // Stuttgart Universities
  { city_id: 'stuttgart', name: 'University of Stuttgart', type: 'Public', founded: 1829, students: 27000, ranking: 180 },
  { city_id: 'stuttgart', name: 'Stuttgart Media University', type: 'Public', founded: 2001, students: 5000, ranking: 300 },
  { city_id: 'stuttgart', name: 'Stuttgart University of Applied Sciences', type: 'Public', founded: 1832, students: 9000, ranking: 280 },
  
  // Düsseldorf Universities
  { city_id: 'dusseldorf', name: 'Heinrich Heine University Düsseldorf', type: 'Public', founded: 1965, students: 35000, ranking: 220 },
  { city_id: 'dusseldorf', name: 'Düsseldorf University of Applied Sciences', type: 'Public', founded: 1971, students: 11000, ranking: 300 },
  { city_id: 'dusseldorf', name: 'Robert Schumann Hochschule Düsseldorf', type: 'Public', founded: 1935, students: 850, ranking: 250 },
  
  // Leipzig Universities
  { city_id: 'leipzig', name: 'Leipzig University', type: 'Public', founded: 1409, students: 29000, ranking: 180 },
  { city_id: 'leipzig', name: 'Leipzig University of Applied Sciences', type: 'Public', founded: 1992, students: 6500, ranking: 320 },
  { city_id: 'leipzig', name: 'University of Music and Theatre Leipzig', type: 'Public', founded: 1843, students: 900, ranking: 200 },
  
  // Dortmund Universities
  { city_id: 'dortmund', name: 'TU Dortmund University', type: 'Public', founded: 1968, students: 34000, ranking: 200 },
  { city_id: 'dortmund', name: 'Dortmund University of Applied Sciences and Arts', type: 'Public', founded: 1971, students: 14500, ranking: 300 },
  { city_id: 'dortmund', name: 'International School of Management Dortmund', type: 'Private', founded: 1990, students: 3500, ranking: 350 },
  
  // Essen Universities
  { city_id: 'essen', name: 'University of Duisburg-Essen', type: 'Public', founded: 2003, students: 43000, ranking: 190 },
  { city_id: 'essen', name: 'Folkwang University of the Arts', type: 'Public', founded: 1927, students: 1600, ranking: 220 },
  
  // Bremen Universities
  { city_id: 'bremen', name: 'University of Bremen', type: 'Public', founded: 1971, students: 23000, ranking: 220 },
  { city_id: 'bremen', name: 'Bremen University of Applied Sciences', type: 'Public', founded: 1982, students: 8500, ranking: 300 },
  { city_id: 'bremen', name: 'University of the Arts Bremen', type: 'Public', founded: 1873, students: 900, ranking: 280 },
  { city_id: 'bremen', name: 'Jacobs University Bremen', type: 'Private', founded: 2001, students: 1500, ranking: 250 },
  
  // Dresden Universities
  { city_id: 'dresden', name: 'Dresden University of Technology', type: 'Public', founded: 1828, students: 37000, ranking: 170 },
  { city_id: 'dresden', name: 'Dresden University of Applied Sciences', type: 'Public', founded: 1992, students: 5000, ranking: 320 },
  { city_id: 'dresden', name: 'Dresden Academy of Fine Arts', type: 'Public', founded: 1764, students: 600, ranking: 200 },
  { city_id: 'dresden', name: 'University of Music Carl Maria von Weber Dresden', type: 'Public', founded: 1856, students: 600, ranking: 220 },
  
  // Hanover Universities
  { city_id: 'hanover', name: 'Leibniz University Hannover', type: 'Public', founded: 1831, students: 29000, ranking: 200 },
  { city_id: 'hanover', name: 'Hannover University of Applied Sciences and Arts', type: 'Public', founded: 1971, students: 13000, ranking: 280 },
  { city_id: 'hanover', name: 'University of Music, Drama and Media Hannover', type: 'Public', founded: 1897, students: 1400, ranking: 200 },
  { city_id: 'hanover', name: 'Hannover Medical School', type: 'Public', founded: 1965, students: 3500, ranking: 150 },
  { city_id: 'hanover', name: 'University of Veterinary Medicine Hannover', type: 'Public', founded: 1778, students: 2600, ranking: 180 },
  
  // Nuremberg Universities
  { city_id: 'nuremberg', name: 'Friedrich-Alexander University Erlangen-Nuremberg', type: 'Public', founded: 1743, students: 40000, ranking: 160 },
  { city_id: 'nuremberg', name: 'Nuremberg Institute of Technology', type: 'Public', founded: 1971, students: 13000, ranking: 300 },
  { city_id: 'nuremberg', name: 'Academy of Fine Arts Nuremberg', type: 'Public', founded: 1662, students: 300, ranking: 250 },
  
  // Additional major universities
  { city_id: 'heidelberg', name: 'Heidelberg University', type: 'Public', founded: 1386, students: 30000, ranking: 65 },
  { city_id: 'heidelberg', name: 'Heidelberg University of Applied Sciences', type: 'Public', founded: 1969, students: 4500, ranking: 280 },
  { city_id: 'heidelberg', name: 'SRH University Heidelberg', type: 'Private', founded: 1969, students: 3500, ranking: 320 },
  
  { city_id: 'karlsruhe', name: 'Karlsruhe Institute of Technology', type: 'Public', founded: 1825, students: 25000, ranking: 90 },
  { city_id: 'karlsruhe', name: 'Karlsruhe University of Applied Sciences', type: 'Public', founded: 1971, students: 8000, ranking: 300 },
  { city_id: 'karlsruhe', name: 'State Academy of Fine Arts Karlsruhe', type: 'Public', founded: 1854, students: 300, ranking: 220 },
  
  { city_id: 'tubingen', name: 'University of Tübingen', type: 'Public', founded: 1477, students: 28000, ranking: 110 },
  
  { city_id: 'freiburg', name: 'University of Freiburg', type: 'Public', founded: 1457, students: 25000, ranking: 120 },
  { city_id: 'freiburg', name: 'Freiburg University of Applied Sciences', type: 'Public', founded: 1971, students: 4500, ranking: 300 },
  { city_id: 'freiburg', name: 'University of Music Freiburg', type: 'Public', founded: 1946, students: 450, ranking: 200 },
  
  { city_id: 'mannheim', name: 'University of Mannheim', type: 'Public', founded: 1967, students: 12000, ranking: 140 },
  { city_id: 'mannheim', name: 'Mannheim University of Applied Sciences', type: 'Public', founded: 1898, students: 5000, ranking: 280 },
  { city_id: 'mannheim', name: 'State University of Music and Performing Arts Mannheim', type: 'Public', founded: 1971, students: 600, ranking: 220 },
  
  // Continue with more universities...
  { city_id: 'bonn', name: 'University of Bonn', type: 'Public', founded: 1818, students: 38000, ranking: 130 },
  { city_id: 'bonn', name: 'Bonn-Rhein-Sieg University of Applied Sciences', type: 'Public', founded: 1995, students: 9500, ranking: 300 },
  
  { city_id: 'munster', name: 'University of Münster', type: 'Public', founded: 1780, students: 46000, ranking: 150 },
  { city_id: 'munster', name: 'Münster University of Applied Sciences', type: 'Public', founded: 1971, students: 15000, ranking: 280 },
  { city_id: 'munster', name: 'Academy of Fine Arts Münster', type: 'Public', founded: 1971, students: 300, ranking: 250 },
  
  { city_id: 'augsburg', name: 'University of Augsburg', type: 'Public', founded: 1970, students: 20000, ranking: 220 },
  { city_id: 'augsburg', name: 'Augsburg University of Applied Sciences', type: 'Public', founded: 1971, students: 7000, ranking: 300 },
  
  { city_id: 'bielefeld', name: 'Bielefeld University', type: 'Public', founded: 1969, students: 25000, ranking: 200 },
  { city_id: 'bielefeld', name: 'Bielefeld University of Applied Sciences', type: 'Public', founded: 1971, students: 11000, ranking: 280 },
  
  { city_id: 'bochum', name: 'Ruhr University Bochum', type: 'Public', founded: 1962, students: 43000, ranking: 160 },
  { city_id: 'bochum', name: 'Bochum University of Applied Sciences', type: 'Public', founded: 1972, students: 8500, ranking: 300 },
  
  { city_id: 'braunschweig', name: 'Technical University of Braunschweig', type: 'Public', founded: 1745, students: 20000, ranking: 200 },
  { city_id: 'braunschweig', name: 'Braunschweig University of Art', type: 'Public', founded: 1963, students: 1200, ranking: 250 },
  
  { city_id: 'aachen', name: 'RWTH Aachen University', type: 'Public', founded: 1870, students: 47000, ranking: 100 },
  { city_id: 'aachen', name: 'FH Aachen University of Applied Sciences', type: 'Public', founded: 1971, students: 15000, ranking: 280 },
  
  { city_id: 'kiel', name: 'Kiel University', type: 'Public', founded: 1665, students: 27000, ranking: 180 },
  { city_id: 'kiel', name: 'Kiel University of Applied Sciences', type: 'Public', founded: 1969, students: 7500, ranking: 300 },
  { city_id: 'kiel', name: 'Muthesius University of Fine Arts and Design', type: 'Public', founded: 1907, students: 600, ranking: 250 },
  
  { city_id: 'wiesbaden', name: 'RheinMain University of Applied Sciences', type: 'Public', founded: 1971, students: 13500, ranking: 300 },
  
  { city_id: 'darmstadt', name: 'Technical University of Darmstadt', type: 'Public', founded: 1877, students: 25000, ranking: 120 },
  { city_id: 'darmstadt', name: 'Darmstadt University of Applied Sciences', type: 'Public', founded: 1876, students: 16500, ranking: 280 },
  
  { city_id: 'mainz', name: 'Johannes Gutenberg University Mainz', type: 'Public', founded: 1477, students: 32000, ranking: 160 },
  { city_id: 'mainz', name: 'Mainz University of Applied Sciences', type: 'Public', founded: 1996, students: 5000, ranking: 300 },
  
  { city_id: 'kassel', name: 'University of Kassel', type: 'Public', founded: 1971, students: 25000, ranking: 220 },
  
  { city_id: 'giessen', name: 'University of Giessen', type: 'Public', founded: 1607, students: 28000, ranking: 200 },
  { city_id: 'giessen', name: 'Giessen University of Applied Sciences', type: 'Public', founded: 1838, students: 6000, ranking: 300 },
  
  { city_id: 'marburg', name: 'University of Marburg', type: 'Public', founded: 1527, students: 26000, ranking: 170 },
  
  { city_id: 'gottingen', name: 'University of Göttingen', type: 'Public', founded: 1737, students: 31000, ranking: 130 },
  
  { city_id: 'oldenburg', name: 'University of Oldenburg', type: 'Public', founded: 1973, students: 16000, ranking: 200 },
  
  { city_id: 'osnabruck', name: 'University of Osnabrück', type: 'Public', founded: 1974, students: 14000, ranking: 220 },
  { city_id: 'osnabruck', name: 'Osnabrück University of Applied Sciences', type: 'Public', founded: 1971, students: 13500, ranking: 300 },
  
  { city_id: 'hildesheim', name: 'University of Hildesheim', type: 'Public', founded: 1978, students: 8500, ranking: 250 },
  { city_id: 'hildesheim', name: 'HAWK University of Applied Sciences and Arts', type: 'Public', founded: 1971, students: 6000, ranking: 320 },
  
  { city_id: 'luneburg', name: 'Leuphana University Lüneburg', type: 'Public', founded: 1946, students: 10000, ranking: 240 },
  
  { city_id: 'clausthal-zellerfeld', name: 'Clausthal University of Technology', type: 'Public', founded: 1775, students: 5000, ranking: 250 },
  
  { city_id: 'paderborn', name: 'Paderborn University', type: 'Public', founded: 1972, students: 20000, ranking: 200 },
  
  { city_id: 'siegen', name: 'University of Siegen', type: 'Public', founded: 1972, students: 19000, ranking: 220 },
  
  { city_id: 'hagen', name: 'FernUniversität in Hagen', type: 'Public', founded: 1974, students: 76000, ranking: 300 },
  
  { city_id: 'rostock', name: 'University of Rostock', type: 'Public', founded: 1419, students: 13500, ranking: 200 },
  
  { city_id: 'greifswald', name: 'University of Greifswald', type: 'Public', founded: 1456, students: 11500, ranking: 180 },
  
  { city_id: 'magdeburg', name: 'Otto von Guericke University Magdeburg', type: 'Public', founded: 1993, students: 14000, ranking: 220 },
  { city_id: 'magdeburg', name: 'Magdeburg-Stendal University of Applied Sciences', type: 'Public', founded: 1991, students: 6500, ranking: 320 },
  
  { city_id: 'halle', name: 'Martin Luther University Halle-Wittenberg', type: 'Public', founded: 1502, students: 20000, ranking: 200 },
  
  { city_id: 'chemnitz', name: 'Chemnitz University of Technology', type: 'Public', founded: 1836, students: 11000, ranking: 220 },
  
  { city_id: 'erfurt', name: 'University of Erfurt', type: 'Public', founded: 1379, students: 6000, ranking: 250 },
  
  { city_id: 'jena', name: 'Friedrich Schiller University Jena', type: 'Public', founded: 1558, students: 18000, ranking: 160 },
  { city_id: 'jena', name: 'Ernst-Abbe-Hochschule Jena', type: 'Public', founded: 1991, students: 4500, ranking: 300 },
  
  { city_id: 'weimar', name: 'Bauhaus University Weimar', type: 'Public', founded: 1860, students: 4000, ranking: 200 },
  
  { city_id: 'ilmenau', name: 'Ilmenau University of Technology', type: 'Public', founded: 1894, students: 6000, ranking: 220 },
  
  { city_id: 'trier', name: 'University of Trier', type: 'Public', founded: 1473, students: 13000, ranking: 220 },
  
  { city_id: 'kaiserslautern', name: 'University of Kaiserslautern', type: 'Public', founded: 1970, students: 14500, ranking: 180 },
  
  { city_id: 'koblenz', name: 'University of Koblenz-Landau', type: 'Public', founded: 1990, students: 17000, ranking: 240 },
  
  { city_id: 'saarbrucken', name: 'Saarland University', type: 'Public', founded: 1948, students: 17000, ranking: 160 },
  { city_id: 'saarbrucken', name: 'htw saar - University of Applied Sciences', type: 'Public', founded: 1971, students: 6000, ranking: 300 },
  
  { city_id: 'flensburg', name: 'University of Flensburg', type: 'Public', founded: 1946, students: 5500, ranking: 280 },
  
  { city_id: 'lubeck', name: 'University of Lübeck', type: 'Public', founded: 1964, students: 5000, ranking: 180 },
  { city_id: 'lubeck', name: 'Lübeck University of Applied Sciences', type: 'Public', founded: 1969, students: 5000, ranking: 300 },
  
  { city_id: 'bamberg', name: 'University of Bamberg', type: 'Public', founded: 1647, students: 13000, ranking: 200 },
  
  { city_id: 'bayreuth', name: 'University of Bayreuth', type: 'Public', founded: 1975, students: 13500, ranking: 160 },
  
  { city_id: 'erlangen', name: 'Friedrich-Alexander University Erlangen-Nuremberg', type: 'Public', founded: 1743, students: 40000, ranking: 160 },
  
  { city_id: 'wurzburg', name: 'University of Würzburg', type: 'Public', founded: 1402, students: 28000, ranking: 140 },
  { city_id: 'wurzburg', name: 'Würzburg University of Applied Sciences', type: 'Public', founded: 1971, students: 9000, ranking: 300 },
  
  { city_id: 'regensburg', name: 'University of Regensburg', type: 'Public', founded: 1962, students: 21000, ranking: 170 },
  { city_id: 'regensburg', name: 'Regensburg University of Applied Sciences', type: 'Public', founded: 1971, students: 11000, ranking: 300 },
  
  { city_id: 'passau', name: 'University of Passau', type: 'Public', founded: 1978, students: 12000, ranking: 200 },
  
  { city_id: 'ingolstadt', name: 'Catholic University of Eichstätt-Ingolstadt', type: 'Private', founded: 1980, students: 5000, ranking: 250 },
  { city_id: 'ingolstadt', name: 'Technische Hochschule Ingolstadt', type: 'Public', founded: 1994, students: 6000, ranking: 300 },
  
  { city_id: 'ulm', name: 'Ulm University', type: 'Public', founded: 1967, students: 10000, ranking: 150 },
  
  { city_id: 'konstanz', name: 'University of Konstanz', type: 'Public', founded: 1966, students: 11500, ranking: 140 },
  { city_id: 'konstanz', name: 'HTWG Konstanz University of Applied Sciences', type: 'Public', founded: 1906, students: 5000, ranking: 300 }
];

/**
 * Generate comprehensive data insertion SQL
 */
export function generateComprehensiveDataSQL(): string {
  // Generate UUIDs for cities
  const cityMap = new Map();
  GERMAN_CITIES_WITH_UNIVERSITIES.forEach((city, index) => {
    const uuid = `550e8400-e29b-41d4-a716-${String(446655440001 + index).padStart(12, '0')}`;
    cityMap.set(city.id, uuid);
  });

  // Generate city inserts
  const cityInserts = GERMAN_CITIES_WITH_UNIVERSITIES.map((city, index) => {
    const uuid = cityMap.get(city.id);
    return `('${uuid}', '${city.name}', 'DE', '${city.state}', '${city.id}', ${city.lat}, ${city.lng}, '{"population": ${city.population}, "description": "German city with universities"}', '{"keywords": ["german", "university", "education", "${city.state.toLowerCase()}"]}')`;
  }).join(',\n  ');

  // Generate university inserts
  let universityIndex = 0;
  const universityInserts = GERMAN_UNIVERSITIES.map(uni => {
    const uuid = `650e8400-e29b-41d4-a716-${String(446655440001 + universityIndex).padStart(12, '0')}`;
    const cityUuid = cityMap.get(uni.city_id);
    const cityName = GERMAN_CITIES_WITH_UNIVERSITIES.find(c => c.id === uni.city_id)?.name || 'Unknown';
    universityIndex++;
    
    return `('${uuid}', '${uni.name}', '${cityName}', '${cityUuid}', 'DE', '${uni.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}', 0, 0, '${uni.type}', ${uni.ranking || 999}, 'https://www.${uni.name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.de', '{"founded": ${uni.founded}, "students": ${uni.students}}')`;
  }).join(',\n  ');

  return `-- Comprehensive German Universities Data
-- Insert all German cities with universities
INSERT INTO public.cities (id, name, country_code, state, slug, lat, lng, metadata, search_doc) VALUES
  ${cityInserts}
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  metadata = EXCLUDED.metadata;

-- Insert all German universities
INSERT INTO public.universities (id, name, city, city_id, country_code, slug, lat, lng, type, ranking, website, external_refs) VALUES
  ${universityInserts}
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  ranking = EXCLUDED.ranking,
  external_refs = EXCLUDED.external_refs;`;
}