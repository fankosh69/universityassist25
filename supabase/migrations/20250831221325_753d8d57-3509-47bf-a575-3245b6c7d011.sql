-- Add city_type column to cities table
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS city_type text;

-- Update cities with population data and city types
UPDATE public.cities SET 
  population_total = 262670,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Aachen';

UPDATE public.cities SET 
  population_total = 67621,
  city_type = 'City',
  region = 'Baden-Württemberg'
WHERE name = 'Aalen';

UPDATE public.cities SET 
  population_total = 52666,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Ahlen';

UPDATE public.cities SET 
  population_total = 74879,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Arnsberg';

UPDATE public.cities SET 
  population_total = 73091,
  city_type = 'County',
  region = 'Bayern'
WHERE name = 'Aschaffenburg';

UPDATE public.cities SET 
  population_total = 301105,
  city_type = 'County',
  region = 'Bayern'
WHERE name = 'Augsburg';

UPDATE public.cities SET 
  population_total = 56881,
  city_type = 'County',
  region = 'Baden-Württemberg'
WHERE name = 'Baden-Baden';

UPDATE public.cities SET 
  population_total = 56688,
  city_type = 'City',
  region = 'Hessen'
WHERE name = 'Bad Homburg vor der Höhe';

UPDATE public.cities SET 
  population_total = 54168,
  city_type = 'City',
  region = 'Rheinland-Pfalz'
WHERE name = 'Bad Kreuznach';

UPDATE public.cities SET 
  population_total = 50620,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Bad Oeynhausen';

UPDATE public.cities SET 
  population_total = 53958,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Bad Salzuflen';

UPDATE public.cities SET 
  population_total = 77150,
  city_type = 'County',
  region = 'Bayern'
WHERE name = 'Bamberg';

UPDATE public.cities SET 
  population_total = 72940,
  city_type = 'County',
  region = 'Bayern'
WHERE name = 'Bayreuth';

UPDATE public.cities SET 
  population_total = 61611,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Bergheim';

UPDATE public.cities SET 
  population_total = 111361,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Bergisch Gladbach';

UPDATE public.cities SET 
  population_total = 3685265,
  city_type = 'County',
  region = 'Berlin'
WHERE name = 'Berlin';

UPDATE public.cities SET 
  population_total = 331605,
  city_type = 'County',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Bielefeld';

UPDATE public.cities SET 
  population_total = 51483,
  city_type = 'City',
  region = 'Baden-Württemberg'
WHERE name = 'Böblingen';

UPDATE public.cities SET 
  population_total = 73257,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Bocholt';

UPDATE public.cities SET 
  population_total = 358676,
  city_type = 'County',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Bochum';

UPDATE public.cities SET 
  population_total = 323336,
  city_type = 'County',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Bonn';

UPDATE public.cities SET 
  population_total = 118535,
  city_type = 'County',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Bottrop';

UPDATE public.cities SET 
  population_total = 74113,
  city_type = 'County',
  region = 'Brandenburg'
WHERE name = 'Brandenburg an der Havel';

UPDATE public.cities SET 
  population_total = 252962,
  city_type = 'County',
  region = 'Niedersachsen'
WHERE name = 'Braunschweig';

UPDATE public.cities SET 
  population_total = 586271,
  city_type = 'County',
  region = 'Bremen'
WHERE name = 'Bremen';

UPDATE public.cities SET 
  population_total = 118610,
  city_type = 'County',
  region = 'Bremen'
WHERE name = 'Bremerhaven';

UPDATE public.cities SET 
  population_total = 73282,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Castrop-Rauxel';

UPDATE public.cities SET 
  population_total = 66834,
  city_type = 'City',
  region = 'Niedersachsen'
WHERE name = 'Celle';

UPDATE public.cities SET 
  population_total = 245618,
  city_type = 'County',
  region = 'Sachsen'
WHERE name = 'Chemnitz';

UPDATE public.cities SET 
  population_total = 95123,
  city_type = 'County',
  region = 'Brandenburg'
WHERE name = 'Cottbus';

UPDATE public.cities SET 
  population_total = 167029,
  city_type = 'County',
  region = 'Hessen'
WHERE name = 'Darmstadt';

UPDATE public.cities SET 
  population_total = 81406,
  city_type = 'County',
  region = 'Niedersachsen'
WHERE name = 'Delmenhorst';

UPDATE public.cities SET 
  population_total = 75402,
  city_type = 'County',
  region = 'Sachsen-Anhalt'
WHERE name = 'Dessau-Roßlau';

UPDATE public.cities SET 
  population_total = 74278,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Detmold';

UPDATE public.cities SET 
  population_total = 66993,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Dinslaken';

UPDATE public.cities SET 
  population_total = 63799,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Dormagen';

UPDATE public.cities SET 
  population_total = 75277,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Dorsten';

UPDATE public.cities SET 
  population_total = 603462,
  city_type = 'County',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Dortmund';

UPDATE public.cities SET 
  population_total = 564904,
  city_type = 'County',
  region = 'Sachsen'
WHERE name = 'Dresden';

UPDATE public.cities SET 
  population_total = 502270,
  city_type = 'County',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Duisburg';

UPDATE public.cities SET 
  population_total = 94568,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Düren';

UPDATE public.cities SET 
  population_total = 618685,
  city_type = 'County',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Düsseldorf';

UPDATE public.cities SET 
  population_total = 51342,
  city_type = 'City',
  region = 'Schleswig-Holstein'
WHERE name = 'Elmshorn';

UPDATE public.cities SET 
  population_total = 218793,
  city_type = 'County',
  region = 'Thüringen'
WHERE name = 'Erfurt';

UPDATE public.cities SET 
  population_total = 115928,
  city_type = 'County',
  region = 'Bayern'
WHERE name = 'Erlangen';

UPDATE public.cities SET 
  population_total = 57534,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Eschweiler';

UPDATE public.cities SET 
  population_total = 574682,
  city_type = 'County',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Essen';

UPDATE public.cities SET 
  population_total = 96182,
  city_type = 'City',
  region = 'Baden-Württemberg'
WHERE name = 'Esslingen am Neckar';

UPDATE public.cities SET 
  population_total = 60021,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Euskirchen';

UPDATE public.cities SET 
  population_total = 96326,
  city_type = 'County',
  region = 'Schleswig-Holstein'
WHERE name = 'Flensburg';

UPDATE public.cities SET 
  population_total = 57107,
  city_type = 'County',
  region = 'Brandenburg'
WHERE name = 'Frankfurt (Oder)';

UPDATE public.cities SET 
  population_total = 756021,
  city_type = 'County',
  region = 'Hessen'
WHERE name = 'Frankfurt am Main';

UPDATE public.cities SET 
  population_total = 52309,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Frechen';

UPDATE public.cities SET 
  population_total = 237460,
  city_type = 'County',
  region = 'Baden-Württemberg'
WHERE name = 'Freiburg im Breisgau';

UPDATE public.cities SET 
  population_total = 62796,
  city_type = 'City',
  region = 'Baden-Württemberg'
WHERE name = 'Friedrichshafen';

UPDATE public.cities SET 
  population_total = 65434,
  city_type = 'City',
  region = 'Hessen'
WHERE name = 'Fulda';

UPDATE public.cities SET 
  population_total = 132036,
  city_type = 'County',
  region = 'Bayern'
WHERE name = 'Fürth';

UPDATE public.cities SET 
  population_total = 59903,
  city_type = 'City',
  region = 'Niedersachsen'
WHERE name = 'Garbsen';

UPDATE public.cities SET 
  population_total = 267930,
  city_type = 'County',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Gelsenkirchen';

UPDATE public.cities SET 
  population_total = 95608,
  city_type = 'County',
  region = 'Thüringen'
WHERE name = 'Gera';

UPDATE public.cities SET 
  population_total = 89179,
  city_type = 'City',
  region = 'Hessen'
WHERE name = 'Gießen';

UPDATE public.cities SET 
  population_total = 75499,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Gladbeck';

UPDATE public.cities SET 
  population_total = 58937,
  city_type = 'City',
  region = 'Baden-Württemberg'
WHERE name = 'Göppingen';

UPDATE public.cities SET 
  population_total = 55186,
  city_type = 'City',
  region = 'Sachsen'
WHERE name = 'Görlitz';

UPDATE public.cities SET 
  population_total = 127259,
  city_type = 'City',
  region = 'Niedersachsen'
WHERE name = 'Göttingen';

UPDATE public.cities SET 
  population_total = 56092,
  city_type = 'City',
  region = 'Mecklenburg-Vorpommern'
WHERE name = 'Greifswald';

UPDATE public.cities SET 
  population_total = 65983,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Grevenbroich';

UPDATE public.cities SET 
  population_total = 50547,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Gronau (Westf.)';

UPDATE public.cities SET 
  population_total = 51290,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Gummersbach';

UPDATE public.cities SET 
  population_total = 100479,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Gütersloh';

UPDATE public.cities SET 
  population_total = 190384,
  city_type = 'County',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Hagen';

UPDATE public.cities SET 
  population_total = 226767,
  city_type = 'County',
  region = 'Sachsen-Anhalt'
WHERE name = 'Halle (Saale)';

UPDATE public.cities SET 
  population_total = 1862565,
  city_type = 'County',
  region = 'Hamburg'
WHERE name = 'Hamburg';

UPDATE public.cities SET 
  population_total = 58244,
  city_type = 'City',
  region = 'Niedersachsen'
WHERE name = 'Hameln';

UPDATE public.cities SET 
  population_total = 179968,
  city_type = 'County',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Hamm';

UPDATE public.cities SET 
  population_total = 97956,
  city_type = 'City',
  region = 'Hessen'
WHERE name = 'Hanau';

UPDATE public.cities SET 
  population_total = 522131,
  city_type = 'City',
  region = 'Niedersachsen'
WHERE name = 'Hannover';

UPDATE public.cities SET 
  population_total = 53044,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Hattingen';

UPDATE public.cities SET 
  population_total = 155756,
  city_type = 'County',
  region = 'Baden-Württemberg'
WHERE name = 'Heidelberg';

UPDATE public.cities SET 
  population_total = 50618,
  city_type = 'City',
  region = 'Baden-Württemberg'
WHERE name = 'Heidenheim an der Brenz';

UPDATE public.cities SET 
  population_total = 131986,
  city_type = 'County',
  region = 'Baden-Württemberg'
WHERE name = 'Heilbronn';

UPDATE public.cities SET 
  population_total = 67503,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Herford';

UPDATE public.cities SET 
  population_total = 155851,
  city_type = 'County',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Herne';

UPDATE public.cities SET 
  population_total = 60941,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Herten';

UPDATE public.cities SET 
  population_total = 55157,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Hilden';

UPDATE public.cities SET 
  population_total = 98510,
  city_type = 'City',
  region = 'Niedersachsen'
WHERE name = 'Hildesheim';

UPDATE public.cities SET 
  population_total = 62160,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Hürth';

UPDATE public.cities SET 
  population_total = 51803,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Ibbenbüren';

UPDATE public.cities SET 
  population_total = 141185,
  city_type = 'County',
  region = 'Bayern'
WHERE name = 'Ingolstadt';

UPDATE public.cities SET 
  population_total = 91811,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Iserlohn';

UPDATE public.cities SET 
  population_total = 109725,
  city_type = 'County',
  region = 'Thüringen'
WHERE name = 'Jena';

UPDATE public.cities SET 
  population_total = 100426,
  city_type = 'County',
  region = 'Rheinland-Pfalz'
WHERE name = 'Kaiserslautern';

UPDATE public.cities SET 
  population_total = 309050,
  city_type = 'County',
  region = 'Baden-Württemberg'
WHERE name = 'Karlsruhe';

UPDATE public.cities SET 
  population_total = 197230,
  city_type = 'County',
  region = 'Hessen'
WHERE name = 'Kassel';

UPDATE public.cities SET 
  population_total = 67645,
  city_type = 'County',
  region = 'Bayern'
WHERE name = 'Kempten (Allgäu)';

UPDATE public.cities SET 
  population_total = 66585,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Kerpen';

UPDATE public.cities SET 
  population_total = 252668,
  city_type = 'County',
  region = 'Schleswig-Holstein'
WHERE name = 'Kiel';

UPDATE public.cities SET 
  population_total = 53028,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Kleve';

UPDATE public.cities SET 
  population_total = 113378,
  city_type = 'County',
  region = 'Rheinland-Pfalz'
WHERE name = 'Koblenz';

UPDATE public.cities SET 
  population_total = 1024621,
  city_type = 'County',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Köln';

UPDATE public.cities SET 
  population_total = 86919,
  city_type = 'City',
  region = 'Baden-Württemberg'
WHERE name = 'Konstanz';

UPDATE public.cities SET 
  population_total = 231406,
  city_type = 'County',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Krefeld';

UPDATE public.cities SET 
  population_total = 50775,
  city_type = 'City',
  region = 'Baden-Württemberg'
WHERE name = 'Lahr/Schwarzwald';

UPDATE public.cities SET 
  population_total = 71863,
  city_type = 'County',
  region = 'Bayern'
WHERE name = 'Landshut';

UPDATE public.cities SET 
  population_total = 59975,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Langenfeld (Rheinland)';

UPDATE public.cities SET 
  population_total = 54142,
  city_type = 'City',
  region = 'Niedersachsen'
WHERE name = 'Langenhagen';

UPDATE public.cities SET 
  population_total = 611850,
  city_type = 'County',
  region = 'Sachsen'
WHERE name = 'Leipzig';

UPDATE public.cities SET 
  population_total = 168581,
  city_type = 'County',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Leverkusen';

UPDATE public.cities SET 
  population_total = 56498,
  city_type = 'City',
  region = 'Niedersachsen'
WHERE name = 'Lingen (Ems)';

UPDATE public.cities SET 
  population_total = 68739,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Lippstadt';

UPDATE public.cities SET 
  population_total = 51349,
  city_type = 'City',
  region = 'Baden-Württemberg'
WHERE name = 'Lörrach';

UPDATE public.cities SET 
  population_total = 216889,
  city_type = 'County',
  region = 'Schleswig-Holstein'
WHERE name = 'Lübeck';

UPDATE public.cities SET 
  population_total = 71212,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Lüdenscheid';

UPDATE public.cities SET 
  population_total = 92858,
  city_type = 'City',
  region = 'Baden-Württemberg'
WHERE name = 'Ludwigsburg';

UPDATE public.cities SET 
  population_total = 177222,
  city_type = 'County',
  region = 'Rheinland-Pfalz'
WHERE name = 'Ludwigshafen am Rhein';

UPDATE public.cities SET 
  population_total = 74785,
  city_type = 'City',
  region = 'Niedersachsen'
WHERE name = 'Lüneburg';

UPDATE public.cities SET 
  population_total = 86163,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Lünen';

UPDATE public.cities SET 
  population_total = 244329,
  city_type = 'County',
  region = 'Sachsen-Anhalt'
WHERE name = 'Magdeburg';

UPDATE public.cities SET 
  population_total = 224684,
  city_type = 'County',
  region = 'Rheinland-Pfalz'
WHERE name = 'Mainz';

UPDATE public.cities SET 
  population_total = 318035,
  city_type = 'County',
  region = 'Baden-Württemberg'
WHERE name = 'Mannheim';

UPDATE public.cities SET 
  population_total = 73544,
  city_type = 'City',
  region = 'Hessen'
WHERE name = 'Marburg';

UPDATE public.cities SET 
  population_total = 86766,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Marl';

UPDATE public.cities SET 
  population_total = 57078,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Meerbusch';

UPDATE public.cities SET 
  population_total = 52255,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Menden (Sauerland)';

UPDATE public.cities SET 
  population_total = 84013,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Minden';

UPDATE public.cities SET 
  population_total = 101503,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Moers';

UPDATE public.cities SET 
  population_total = 267213,
  city_type = 'County',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Mönchengladbach';

UPDATE public.cities SET 
  population_total = 173050,
  city_type = 'County',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Mülheim an der Ruhr';

UPDATE public.cities SET 
  population_total = 1505005,
  city_type = 'County',
  region = 'Bayern'
WHERE name = 'München';

UPDATE public.cities SET 
  population_total = 308258,
  city_type = 'County',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Münster';

UPDATE public.cities SET 
  population_total = 60344,
  city_type = 'City',
  region = 'Mecklenburg-Vorpommern'
WHERE name = 'Neubrandenburg';

UPDATE public.cities SET 
  population_total = 79809,
  city_type = 'County',
  region = 'Schleswig-Holstein'
WHERE name = 'Neumünster';

UPDATE public.cities SET 
  population_total = 154317,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Neuss';

UPDATE public.cities SET 
  population_total = 52945,
  city_type = 'County',
  region = 'Rheinland-Pfalz'
WHERE name = 'Neustadt an der Weinstraße';

UPDATE public.cities SET 
  population_total = 62641,
  city_type = 'City',
  region = 'Bayern'
WHERE name = 'Neu-Ulm';

UPDATE public.cities SET 
  population_total = 67083,
  city_type = 'City',
  region = 'Rheinland-Pfalz'
WHERE name = 'Neuwied';

UPDATE public.cities SET 
  population_total = 82844,
  city_type = 'City',
  region = 'Schleswig-Holstein'
WHERE name = 'Norderstedt';

UPDATE public.cities SET 
  population_total = 56973,
  city_type = 'City',
  region = 'Niedersachsen'
WHERE name = 'Nordhorn';

UPDATE public.cities SET 
  population_total = 529508,
  city_type = 'County',
  region = 'Bayern'
WHERE name = 'Nürnberg';

UPDATE public.cities SET 
  population_total = 213646,
  city_type = 'County',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Oberhausen';

UPDATE public.cities SET 
  population_total = 132746,
  city_type = 'County',
  region = 'Hessen'
WHERE name = 'Offenbach am Main';

UPDATE public.cities SET 
  population_total = 62993,
  city_type = 'City',
  region = 'Baden-Württemberg'
WHERE name = 'Offenburg';

UPDATE public.cities SET 
  population_total = 176614,
  city_type = 'County',
  region = 'Niedersachsen'
WHERE name = 'Oldenburg (Oldb)';

UPDATE public.cities SET 
  population_total = 166057,
  city_type = 'County',
  region = 'Niedersachsen'
WHERE name = 'Osnabrück';

UPDATE public.cities SET 
  population_total = 156378,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Paderborn';

UPDATE public.cities SET 
  population_total = 53039,
  city_type = 'County',
  region = 'Bayern'
WHERE name = 'Passau';

UPDATE public.cities SET 
  population_total = 50987,
  city_type = 'City',
  region = 'Niedersachsen'
WHERE name = 'Peine';

UPDATE public.cities SET 
  population_total = 134912,
  city_type = 'County',
  region = 'Baden-Württemberg'
WHERE name = 'Pforzheim';

UPDATE public.cities SET 
  population_total = 65599,
  city_type = 'City',
  region = 'Sachsen'
WHERE name = 'Plauen';

UPDATE public.cities SET 
  population_total = 184754,
  city_type = 'County',
  region = 'Brandenburg'
WHERE name = 'Potsdam';

UPDATE public.cities SET 
  population_total = 56150,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Pulheim';

UPDATE public.cities SET 
  population_total = 50741,
  city_type = 'City',
  region = 'Baden-Württemberg'
WHERE name = 'Rastatt';

UPDATE public.cities SET 
  population_total = 89368,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Ratingen';

UPDATE public.cities SET 
  population_total = 50628,
  city_type = 'City',
  region = 'Baden-Württemberg'
WHERE name = 'Ravensburg';

UPDATE public.cities SET 
  population_total = 115344,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Recklinghausen';

UPDATE public.cities SET 
  population_total = 151389,
  city_type = 'County',
  region = 'Bayern'
WHERE name = 'Regensburg';

UPDATE public.cities SET 
  population_total = 113828,
  city_type = 'County',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Remscheid';

UPDATE public.cities SET 
  population_total = 118852,
  city_type = 'City',
  region = 'Baden-Württemberg'
WHERE name = 'Reutlingen';

UPDATE public.cities SET 
  population_total = 77209,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Rheine';

UPDATE public.cities SET 
  population_total = 65274,
  city_type = 'County',
  region = 'Bayern'
WHERE name = 'Rosenheim';

UPDATE public.cities SET 
  population_total = 205307,
  city_type = 'County',
  region = 'Mecklenburg-Vorpommern'
WHERE name = 'Rostock';

UPDATE public.cities SET 
  population_total = 65627,
  city_type = 'City',
  region = 'Hessen'
WHERE name = 'Rüsselsheim am Main';

UPDATE public.cities SET 
  population_total = 182971,
  city_type = 'City',
  region = 'Saarland'
WHERE name = 'Saarbrücken';

UPDATE public.cities SET 
  population_total = 104970,
  city_type = 'County',
  region = 'Niedersachsen'
WHERE name = 'Salzgitter';

UPDATE public.cities SET 
  population_total = 56521,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Sankt Augustin';

UPDATE public.cities SET 
  population_total = 64416,
  city_type = 'City',
  region = 'Baden-Württemberg'
WHERE name = 'Schwäbisch Gmünd';

UPDATE public.cities SET 
  population_total = 54481,
  city_type = 'County',
  region = 'Bayern'
WHERE name = 'Schweinfurt';

UPDATE public.cities SET 
  population_total = 98308,
  city_type = 'County',
  region = 'Mecklenburg-Vorpommern'
WHERE name = 'Schwerin';

UPDATE public.cities SET 
  population_total = 102685,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Siegen';

UPDATE public.cities SET 
  population_total = 61422,
  city_type = 'City',
  region = 'Baden-Württemberg'
WHERE name = 'Sindelfingen';

UPDATE public.cities SET 
  population_total = 165626,
  city_type = 'County',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Solingen';

UPDATE public.cities SET 
  population_total = 57684,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Stolberg (Rhld.)';

UPDATE public.cities SET 
  population_total = 54094,
  city_type = 'City',
  region = 'Mecklenburg-Vorpommern'
WHERE name = 'Stralsund';

UPDATE public.cities SET 
  population_total = 612663,
  city_type = 'County',
  region = 'Baden-Württemberg'
WHERE name = 'Stuttgart';

UPDATE public.cities SET 
  population_total = 104342,
  city_type = 'County',
  region = 'Rheinland-Pfalz'
WHERE name = 'Trier';

UPDATE public.cities SET 
  population_total = 75901,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Troisdorf';

UPDATE public.cities SET 
  population_total = 92322,
  city_type = 'City',
  region = 'Baden-Württemberg'
WHERE name = 'Tübingen';

UPDATE public.cities SET 
  population_total = 129882,
  city_type = 'County',
  region = 'Baden-Württemberg'
WHERE name = 'Ulm';

UPDATE public.cities SET 
  population_total = 58333,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Unna';

UPDATE public.cities SET 
  population_total = 82463,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Velbert';

UPDATE public.cities SET 
  population_total = 78373,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Viersen';

UPDATE public.cities SET 
  population_total = 89756,
  city_type = 'City',
  region = 'Baden-Württemberg'
WHERE name = 'Villingen-Schwenningen';

UPDATE public.cities SET 
  population_total = 57313,
  city_type = 'City',
  region = 'Baden-Württemberg'
WHERE name = 'Waiblingen';

UPDATE public.cities SET 
  population_total = 65954,
  city_type = 'County',
  region = 'Thüringen'
WHERE name = 'Weimar';

UPDATE public.cities SET 
  population_total = 60785,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Wesel';

UPDATE public.cities SET 
  population_total = 54665,
  city_type = 'City',
  region = 'Hessen'
WHERE name = 'Wetzlar';

UPDATE public.cities SET 
  population_total = 288850,
  city_type = 'County',
  region = 'Hessen'
WHERE name = 'Wiesbaden';

UPDATE public.cities SET 
  population_total = 75745,
  city_type = 'County',
  region = 'Niedersachsen'
WHERE name = 'Wilhelmshaven';

UPDATE public.cities SET 
  population_total = 91808,
  city_type = 'City',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Witten';

UPDATE public.cities SET 
  population_total = 52604,
  city_type = 'City',
  region = 'Niedersachsen'
WHERE name = 'Wolfenbüttel';

UPDATE public.cities SET 
  population_total = 129560,
  city_type = 'County',
  region = 'Niedersachsen'
WHERE name = 'Wolfsburg';

UPDATE public.cities SET 
  population_total = 86753,
  city_type = 'County',
  region = 'Rheinland-Pfalz'
WHERE name = 'Worms';

UPDATE public.cities SET 
  population_total = 358193,
  city_type = 'County',
  region = 'Nordrhein-Westfalen'
WHERE name = 'Wuppertal';

UPDATE public.cities SET 
  population_total = 133258,
  city_type = 'County',
  region = 'Bayern'
WHERE name = 'Würzburg';

UPDATE public.cities SET 
  population_total = 87410,
  city_type = 'City',
  region = 'Sachsen'
WHERE name = 'Zwickau';

-- Update the city_stats view to include city_type
DROP VIEW IF EXISTS public.city_stats CASCADE;

CREATE VIEW public.city_stats AS
SELECT 
  c.id,
  c.name,
  c.slug,
  r.name as region,
  c.country_code,
  c.population_total,
  c.population_asof,
  c.city_type,
  COUNT(u.id) as uni_count
FROM public.cities c
LEFT JOIN public.regions r ON c.region_id = r.id
LEFT JOIN public.universities u ON u.city_id = c.id
GROUP BY c.id, c.name, c.slug, r.name, c.country_code, c.population_total, c.population_asof, c.city_type
ORDER BY c.name;