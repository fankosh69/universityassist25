-- Seed predefined gamification badges
INSERT INTO badges (code, title_en, title_ar, title_de, description_en, description_ar, description_de, icon)
VALUES
  ('profile_pioneer', 'Profile Pioneer', 'رائد الملف الشخصي', 'Profil-Pionier', 
   'Complete your student profile', 'أكمل ملفك الشخصي الطلابي', 'Vervollständige dein Studentenprofil', 
   'user-check'),
  
  ('document_dynamo', 'Document Dynamo', 'محترف الوثائق', 'Dokumenten-Dynamo',
   'Upload and verify your first document', 'قم بتحميل والتحقق من وثيقتك الأولى', 'Lade dein erstes Dokument hoch und verifiziere es',
   'file-check'),
  
  ('deadline_guardian', 'Deadline Guardian', 'حارس المواعيد النهائية', 'Fristen-Hüter',
   'Add programs to your watchlist and stay on track', 'أضف البرامج إلى قائمة المراقبة وابق على المسار الصحيح', 'Füge Programme zu deiner Watchlist hinzu und bleibe am Ball',
   'calendar-check'),
  
  ('language_climber_b1', 'Language Climber B1', 'متسلق اللغة B1', 'Sprachkletterer B1',
   'Achieve B1 level language certification', 'احصل على شهادة اللغة بمستوى B1', 'Erreiche B1-Sprachniveau-Zertifizierung',
   'award'),
  
  ('language_climber_b2', 'Language Climber B2', 'متسلق اللغة B2', 'Sprachkletterer B2',
   'Achieve B2 level language certification', 'احصل على شهادة اللغة بمستوى B2', 'Erreiche B2-Sprachniveau-Zertifizierung',
   'award'),
  
  ('language_climber_c1', 'Language Climber C1', 'متسلق اللغة C1', 'Sprachkletterer C1',
   'Achieve C1 level language certification', 'احصل على شهادة اللغة بمستوى C1', 'Erreiche C1-Sprachniveau-Zertifizierung',
   'trophy'),
  
  ('uni_assist_pro', 'Uni-Assist Pro', 'محترف Uni-Assist', 'Uni-Assist-Profi',
   'Successfully prepare for uni-assist application', 'استعد بنجاح لتقديم طلب Uni-Assist', 'Bereite dich erfolgreich auf die uni-assist-Bewerbung vor',
   'briefcase'),
  
  ('first_application', 'First Application', 'أول طلب', 'Erste Bewerbung',
   'Submit your first university application', 'قدم طلبك الجامعي الأول', 'Reiche deine erste Universitätsbewerbung ein',
   'send')
ON CONFLICT (code) DO NOTHING;