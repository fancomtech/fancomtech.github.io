/* ข้อมูลเริ่มต้น — รักษาคลังคำถามเรื่องยาเดิม + ขยายหมวด */
const DEFAULT_CATEGORIES = [
  { id: 'cat_drug_danger', name: 'อันตรายจากการใช้ยา', description: 'ความรู้เรื่องอันตรายจากยาเสพติดและการใช้ยาผิด', icon: '⚠️', color: '#ef4444', gradeLevel: 'ทุกระดับ', difficulty: 'mixed', enabled: true, createdAt: 1, updatedAt: 1 },
  { id: 'cat_rational', name: 'การใช้ยาอย่างสมเหตุผล', description: 'ใช้ยาให้ถูกคน ถูกโรค ถูกขนาด ถูกเวลา', icon: '💊', color: '#22c55e', gradeLevel: 'ทุกระดับ', difficulty: 'mixed', enabled: true, createdAt: 1, updatedAt: 1 },
  { id: 'cat_label', name: 'การอ่านฉลากยา', description: 'อ่านฉลากและเอกสารกำกับยาอย่างถูกต้อง', icon: '🏷️', color: '#3b82f6', gradeLevel: 'ทุกระดับ', difficulty: 'easy', enabled: true, createdAt: 1, updatedAt: 1 },
  { id: 'cat_home', name: 'ยาสามัญประจำบ้าน', description: 'ยาที่ควรมีติดบ้านและการใช้เบื้องต้น', icon: '🏠', color: '#f59e0b', gradeLevel: 'ทุกระดับ', difficulty: 'easy', enabled: true, createdAt: 1, updatedAt: 1 },
  { id: 'cat_allergy', name: 'การแพ้ยาและผลข้างเคียง', description: 'อาการแพ้ยา ผลข้างเคียง และการรับมือ', icon: '🤧', color: '#ec4899', gradeLevel: 'ทุกระดับ', difficulty: 'medium', enabled: true, createdAt: 1, updatedAt: 1 },
  { id: 'cat_antibiotic', name: 'การใช้ยาปฏิชีวนะ', description: 'ใช้ยาปฏิชีวนะอย่างถูกต้อง ไม่สร้างเชื้อดื้อยา', icon: '🦠', color: '#8b5cf6', gradeLevel: 'ทุกระดับ', difficulty: 'medium', enabled: true, createdAt: 1, updatedAt: 1 },
  { id: 'cat_child', name: 'การใช้ยาในเด็ก', description: 'ข้อควรระวังเมื่อให้ยาเด็ก', icon: '👶', color: '#06b6d4', gradeLevel: 'ทุกระดับ', difficulty: 'medium', enabled: true, createdAt: 1, updatedAt: 1 },
  { id: 'cat_storage', name: 'การเก็บรักษายา', description: 'เก็บยาให้ปลอดภัยและคงคุณภาพ', icon: '🧊', color: '#14b8a6', gradeLevel: 'ทุกระดับ', difficulty: 'easy', enabled: true, createdAt: 1, updatedAt: 1 },
  { id: 'cat_expiry', name: 'วันหมดอายุของยา', description: 'ตรวจสอบวันหมดอายุและความเสี่ยง', icon: '📅', color: '#f97316', gradeLevel: 'ทุกระดับ', difficulty: 'easy', enabled: true, createdAt: 1, updatedAt: 1 },
  { id: 'cat_interaction', name: 'อาหารและยาที่เกิดปฏิกิริยา', description: 'อาหาร-ยาที่ห้ามใช้ร่วมกัน', icon: '🍽️', color: '#e11d48', gradeLevel: 'ทุกระดับ', difficulty: 'hard', enabled: true, createdAt: 1, updatedAt: 1 },
  { id: 'cat_health', name: 'สุขศึกษา', description: 'ความรู้สุขศึกษาทั่วไป', icon: '❤️', color: '#f43f5e', gradeLevel: 'ทุกระดับ', difficulty: 'mixed', enabled: true, createdAt: 1, updatedAt: 1 },
  { id: 'cat_science', name: 'วิทยาศาสตร์', description: 'ความรู้วิทยาศาสตร์พื้นฐาน', icon: '🔬', color: '#6366f1', gradeLevel: 'ทุกระดับ', difficulty: 'mixed', enabled: true, createdAt: 1, updatedAt: 1 },
  { id: 'cat_math', name: 'คณิตศาสตร์', description: 'คำถามคณิตศาสตร์', icon: '🔢', color: '#0ea5e9', gradeLevel: 'ทุกระดับ', difficulty: 'mixed', enabled: true, createdAt: 1, updatedAt: 1 },
  { id: 'cat_thai', name: 'ภาษาไทย', description: 'ความรู้ภาษาไทย', icon: '📖', color: '#a855f7', gradeLevel: 'ทุกระดับ', difficulty: 'mixed', enabled: true, createdAt: 1, updatedAt: 1 },
  { id: 'cat_eng', name: 'ภาษาอังกฤษ', description: 'English knowledge', icon: '🔤', color: '#64748b', gradeLevel: 'ทุกระดับ', difficulty: 'mixed', enabled: true, createdAt: 1, updatedAt: 1 },
  { id: 'cat_religion', name: 'วิชาศาสนา', description: 'ความรู้ทางศาสนาและศีลธรรม', icon: '🙏', color: '#ca8a04', gradeLevel: 'ทุกระดับ', difficulty: 'mixed', enabled: true, createdAt: 1, updatedAt: 1 },
  { id: 'cat_general', name: 'ความรู้ทั่วไป', description: 'ความรู้รอบตัว', icon: '🌍', color: '#10b981', gradeLevel: 'ทุกระดับ', difficulty: 'mixed', enabled: true, createdAt: 1, updatedAt: 1 },
  { id: 'cat_custom', name: 'หมวดที่ครูสร้างเอง', description: 'หมวดสำรองสำหรับครูเพิ่มเอง', icon: '✏️', color: '#7c3aed', gradeLevel: 'ทุกระดับ', difficulty: 'mixed', enabled: true, createdAt: 1, updatedAt: 1 }
];

const DEFAULT_QUESTIONS = [
  // --- อันตรายจากการใช้ยา (คลังเดิม) ---
  { id: 'q1', topicId: 'cat_drug_danger', q: 'การเสพติดคืออะไร?', options: ['การใช้ยาตามแพทย์สั่ง', 'ภาวะที่ร่างกายและจิตใจต้องการสารนั้นอย่างรุนแรงจนควบคุมไม่ได้', 'การทดลองใช้ยาครั้งเดียว', 'การดื่มกาแฟทุกเช้า'], answer: 1, explain: 'การเสพติดคือภาวะที่สมองเปลี่ยนแปลง ทำให้ควบคุมการใช้สารไม่ได้ แม้รู้ว่ามีอันตราย', difficulty: 'easy', questionType: 'mcq' },
  { id: 'q2', topicId: 'cat_drug_danger', q: 'ยาบ้ามีผลต่อร่างกายอย่างไรในระยะสั้น?', options: ['ทำให้ง่วงนอน', 'ทำให้ตื่นตัวผิดปกติและหัวใจเต้นเร็ว', 'ทำให้ความดันลดลง', 'เพิ่มความอยากอาหาร'], answer: 1, explain: 'ยาบ้าเป็นยากระตุ้นประสาท ทำให้ตื่นตัวมาก หัวใจเต้นเร็ว ความดันสูง เสี่ยงชักหรือหัวใจวาย', difficulty: 'easy', questionType: 'mcq' },
  { id: 'q3', topicId: 'cat_drug_danger', q: 'การใช้เข็มฉีดยาร่วมกับผู้อื่นเสี่ยงโรคใดมากที่สุด?', options: ['ไข้หวัด', 'HIV และไวรัสตับอักเสบ', 'โรคกระเพาะ', 'โรคภูมิแพ้'], answer: 1, explain: 'การใช้เข็มร่วมกันแพร่เชื้อ HIV และไวรัสตับอักเสบ B/C ได้ง่ายมาก', difficulty: 'easy', questionType: 'mcq' },
  { id: 'q4', topicId: 'cat_drug_danger', q: 'สารเคมีหลักในบุหรี่ที่ทำให้เสพติดคืออะไร?', options: ['ทาร์', 'นิโคติน', 'คาร์บอนมอนอกไซด์', 'แอมโมเนีย'], answer: 1, explain: 'นิโคตินออกฤทธิ์ต่อสมองเร็ว ทำให้เกิดการเสพติดได้ง่าย', difficulty: 'easy', questionType: 'mcq' },
  { id: 'q5', topicId: 'cat_drug_danger', q: 'การดื่มสุราปริมาณมากอย่างรวดเร็วอาจเกิดภาวะใด?', options: ['ภาวะขาดน้ำ', 'ภาวะแอลกอฮอล์เป็นพิษ', 'ภาวะขาดวิตามิน', 'ภาวะโลหิตจาง'], answer: 1, explain: 'อาจทำให้ระบบหายใจล้มเหลว หมดสติ และเสียชีวิตได้', difficulty: 'medium', questionType: 'mcq' },
  { id: 'q6', topicId: 'cat_drug_danger', q: 'สัญญาณเตือนว่าอาจกำลังติดยาคือข้อใด?', options: ['นอนหลับปกติ', 'ต้องใช้สารมากขึ้นเพื่อให้ได้ผลเท่าเดิม', 'มีสมาธิดีขึ้น', 'น้ำหนักคงที่'], answer: 1, explain: 'การทนต่อยา (Tolerance) เป็นสัญญาณสำคัญของการเสพติด', difficulty: 'easy', questionType: 'mcq' },
  { id: 'q7', topicId: 'cat_drug_danger', q: 'การใช้ยาเสพติดขณะตั้งครรภ์ส่งผลอย่างไร?', options: ['ไม่มีผล', 'ทารกอาจคลอดก่อนกำหนด น้ำหนักน้อย หรือติดสารตั้งแต่เกิด', 'ทารกแข็งแรงขึ้น', 'ช่วยให้นอนหลับดี'], answer: 1, explain: 'สารเสพติดผ่านรกไปยังทารกได้ ทำให้เสี่ยงคลอดก่อนกำหนดหรือมีอาการถอนยา', difficulty: 'medium', questionType: 'mcq' },
  { id: 'q8', topicId: 'cat_drug_danger', q: 'เฮโรอีนจัดเป็นยาเสพติดประเภทใดตามกฎหมายไทย?', options: ['ประเภท 2', 'ประเภท 1', 'ประเภท 3', 'ประเภท 5'], answer: 1, explain: 'เฮโรอีนเป็นยาเสพติดให้โทษประเภท 1 ห้ามผลิต จำหน่าย มีไว้ในครอบครอง', difficulty: 'medium', questionType: 'mcq' },
  { id: 'q9', topicId: 'cat_drug_danger', q: 'การใช้ยากล่อมประสาทร่วมกับแอลกอฮอล์อันตรายอย่างไร?', options: ['ไม่มีอันตราย', 'อาจทำให้ระบบหายใจล้มเหลวและเสียชีวิต', 'ช่วยให้นอนหลับดีขึ้น', 'ลดฤทธิ์แอลกอฮอล์'], answer: 1, explain: 'ทั้งคู่เป็นยากดประสาท ใช้ร่วมกันเสริมฤทธิ์รุนแรง อาจหยุดหายใจได้', difficulty: 'hard', questionType: 'mcq' },
  { id: 'q10', topicId: 'cat_drug_danger', q: 'การป้องกันการเสพติดที่ดีที่สุดคืออะไร?', options: ['ทดลองใช้ครั้งเดียว', 'ไม่เริ่มใช้ตั้งแต่แรก และมีทักษะปฏิเสธ', 'ใช้เฉพาะตอนเครียด', 'ใช้ตามเพื่อน'], answer: 1, explain: 'การไม่เริ่มใช้เลยคือวิธีป้องกันที่ดีที่สุด', difficulty: 'easy', questionType: 'mcq' },
  { id: 'q11', topicId: 'cat_drug_danger', q: 'ยาไอซ์มีลักษณะอย่างไร?', options: ['ของเหลวใส', 'ผลึกคล้ายแก้วหรือน้ำแข็ง', 'ผงสีน้ำตาล', 'เม็ดสีชมพู'], answer: 1, explain: 'ยาไอซ์เป็นผลึกใสคล้ายแก้ว เป็นเมทแอมเฟตามีนบริสุทธิ์ที่อันตรายสูง', difficulty: 'easy', questionType: 'mcq' },
  { id: 'q12', topicId: 'cat_drug_danger', q: 'สารเสพติดส่งผลต่อสมองส่วนใดที่ทำให้เสพติด?', options: ['สมองส่วนหลัง', 'ระบบรางวัลของสมอง (Reward system)', 'ไขสันหลัง', 'สมองส่วนการหายใจอย่างเดียว'], answer: 1, explain: 'ยาเสพติดกระตุ้นระบบรางวัล ทำให้หลั่งโดพามีนจำนวนมาก', difficulty: 'medium', questionType: 'mcq' },
  { id: 'q13', topicId: 'cat_drug_danger', q: 'Overdose จากฝิ่น/เฮโรอีนมักเสียชีวิตด้วยสาเหตุใด?', options: ['หัวใจวายอย่างเดียว', 'ระบบหายใจล้มเหลว', 'เลือดออกในสมอง', 'ไตวาย'], answer: 1, explain: 'ฝิ่นกดศูนย์กลางการหายใจ ทำให้หายใจช้าลงจนหยุดหายใจ', difficulty: 'hard', questionType: 'mcq' },
  { id: 'q14', topicId: 'cat_drug_danger', q: 'ผลกระทบทางสังคมจากการใช้ยาเสพติดคือข้อใด?', options: ['ครอบครัวอบอุ่นขึ้น', 'ครอบครัวแตกแยก อาชญากรรมเพิ่มขึ้น', 'ชุมชนเข้มแข็ง', 'เศรษฐกิจดีขึ้น'], answer: 1, explain: 'นำไปสู่ปัญหาครอบครัว เศรษฐกิจ การศึกษา และอาชญากรรม', difficulty: 'easy', questionType: 'mcq' },
  { id: 'q15', topicId: 'cat_drug_danger', q: 'การใช้ยาบ้าร่วมกับแอลกอฮอล์ส่งผลอย่างไร?', options: ['ลดอันตราย', 'บดบังอาการมึนเมา ดื่มมากขึ้น และเพิ่มภาระหัวใจ', 'ฤทธิ์ยาบ้าหายไป', 'ไม่มีปฏิกิริยา'], answer: 1, explain: 'แอลกอฮอล์กดประสาท ยาบ้ากระตุ้น ทำให้ไม่รู้สึกเมาและหัวใจทำงานหนัก', difficulty: 'hard', questionType: 'mcq' },

  // --- True/False สำหรับโหมดถูกผิด ---
  { id: 'q16', topicId: 'cat_drug_danger', q: 'การใช้เข็มฉีดยาร่วมกับผู้อื่นเพิ่มความเสี่ยงติด HIV', options: ['ถูก', 'ผิด'], answer: 0, explain: 'ถูกต้อง — การใช้เข็มร่วมกันเป็นช่องทางแพร่เชื้อสำคัญ', difficulty: 'easy', questionType: 'tf' },
  { id: 'q17', topicId: 'cat_drug_danger', q: 'การเสพติดเกิดได้จากการใช้เพียงครั้งเดียวในบางคน', options: ['ถูก', 'ผิด'], answer: 0, explain: 'ถูกต้อง — บางสารเสพติดเร็วมากแม้ใช้ครั้งเดียว', difficulty: 'medium', questionType: 'tf' },
  { id: 'q18', topicId: 'cat_rational', q: 'ควรหยุดยาปฏิชีวนะทันทีเมื่ออาการดีขึ้น แม้ยังกินไม่ครบคอร์ส', options: ['ถูก', 'ผิด'], answer: 1, explain: 'ผิด — ควรใช้ครบตามแพทย์สั่งเพื่อป้องกันเชื้อดื้อยา', difficulty: 'medium', questionType: 'tf' },

  // --- การใช้ยาอย่างสมเหตุผล ---
  { id: 'q19', topicId: 'cat_rational', q: 'หลักการใช้ยาอย่างสมเหตุผลข้อใดถูกต้อง?', options: ['ใช้ยาตามเพื่อนแนะนำ', 'ถูกคน ถูกโรค ถูกยา ถูกขนาด ถูกเวลา', 'ซื้อยารับประทานเองเสมอ', 'ใช้ยาหลายขนานพร้อมกันโดยไม่ปรึกษา'], answer: 1, explain: 'หลัก 5 ถูก: ถูกคน ถูกโรค ถูกยา ถูกขนาด ถูกเวลา', difficulty: 'easy', questionType: 'mcq' },
  { id: 'q20', topicId: 'cat_rational', q: 'ก่อนใช้ยาควรทำสิ่งใดเป็นอันดับแรก?', options: ['อ่านรีวิวออนไลน์', 'อ่านฉลากและปรึกษาเภสัชกร/แพทย์เมื่อสงสัย', 'กินทันทีเมื่อมีอาการ', 'ถามเพื่อนในแชท'], answer: 1, explain: 'อ่านฉลากและปรึกษาผู้เชี่ยวชาญเมื่อไม่แน่ใจ', difficulty: 'easy', questionType: 'mcq' },

  // --- ฉลากยา ---
  { id: 'q21', topicId: 'cat_label', q: 'ข้อมูลใดมักพบบนฉลากยา?', options: ['ราคาหุ้นบริษัท', 'ชื่อยา ขนาด ความถี่ ข้อห้าม วันหมดอายุ', 'สูตรลับการผลิต', 'ที่อยู่เพื่อนบ้าน'], answer: 1, explain: 'ฉลากยาต้องมีชื่อยา ขนาด การใช้ ข้อห้าม และวันหมดอายุ', difficulty: 'easy', questionType: 'mcq' },
  { id: 'q22', topicId: 'cat_label', q: 'สัญลักษณ์ห้ามใช้ในเด็กบนฉลากหมายถึงอะไร?', options: ['ยาสำหรับเด็กเท่านั้น', 'ไม่ควรใช้ในเด็กตามที่ระบุ', 'ยาของเล่น', 'ยาไม่มีผลใดๆ'], answer: 1, explain: 'หมายถึงมีข้อจำกัดหรือห้ามใช้ในเด็ก', difficulty: 'easy', questionType: 'mcq' },

  // --- ยาสามัญประจำบ้าน ---
  { id: 'q23', topicId: 'cat_home', q: 'ยาพาราเซตามอลใช้บรรเทาอาการใด?', options: ['ติดเชื้อแบคทีเรีย', 'ไข้และปวดเมื่อย', 'แพ้รุนแรง', 'ความดันสูง'], answer: 1, explain: 'พาราเซตามอลใช้ลดไข้และบรรเทาปวด', difficulty: 'easy', questionType: 'mcq' },
  { id: 'q24', topicId: 'cat_home', q: 'ข้อใดควรมีในตู้ยาสามัญประจำบ้าน?', options: ['ยาปฏิชีวนะเหลือใช้', 'พลาสเตอร์ ยาลดไข้ ยาฆ่าเชื้อภายนอก', 'ยาเสพติด', 'ยาที่หมดอายุแล้ว'], answer: 1, explain: 'ควรมีอุปกรณ์และยาพื้นฐานที่ยังไม่หมดอายุ', difficulty: 'easy', questionType: 'mcq' },

  // --- แพ้ยา ---
  { id: 'q25', topicId: 'cat_allergy', q: 'อาการแพ้ยารุนแรงที่ต้องพบแพทย์ทันทีคือข้อใด?', options: ['ง่วงเล็กน้อย', 'ผื่นลมพิษ หายใจลำบาก หน้าบวม', 'รสขมในปาก', 'ปัสสาวะสีเหลืองปกติ'], answer: 1, explain: 'อาการแพ้รุนแรง (anaphylaxis) อันตรายถึงชีวิต', difficulty: 'medium', questionType: 'mcq' },

  // --- ยาปฏิชีวนะ ---
  { id: 'q26', topicId: 'cat_antibiotic', q: 'ยาปฏิชีวนะใช้ฆ่าเชื้อชนิดใด?', options: ['ไวรัสทุกชนิด', 'แบคทีเรีย', 'เชื้อราเท่านั้น', 'ปรสิตทุกชนิด'], answer: 1, explain: 'ยาปฏิชีวนะออกฤทธิ์ต่อแบคทีเรีย ไม่ได้ฆ่าไวรัส', difficulty: 'easy', questionType: 'mcq' },
  { id: 'q27', topicId: 'cat_antibiotic', q: 'ทำไมไม่ควรซื้อยาปฏิชีวนะกินเองโดยไม่จำเป็น?', options: ['ราคาแพง', 'อาจเกิดเชื้อดื้อยาและผลข้างเคียง', 'รสชาติไม่อร่อย', 'หาซื้อยาก'], answer: 1, explain: 'การใช้ไม่เหมาะสมทำให้เชื้อดื้อยาและอันตราย', difficulty: 'medium', questionType: 'mcq' },

  // --- ยาในเด็ก ---
  { id: 'q28', topicId: 'cat_child', q: 'การคำนวณขนาดยาในเด็กมักอิงกับอะไร?', options: ['ส่วนสูงเพื่อน', 'น้ำหนักตัวและอายุตามคำแนะนำแพทย์', 'สีของยา', 'จำนวนเม็ดที่เหลือ'], answer: 1, explain: 'ขนาดยาเด็กคำนวณตามน้ำหนัก/อายุภายใต้คำแนะนำแพทย์', difficulty: 'medium', questionType: 'mcq' },

  // --- เก็บรักษายา ---
  { id: 'q29', topicId: 'cat_storage', q: 'สถานที่เก็บยาที่เหมาะสมโดยทั่วไปคือ?', options: ['ในรถที่ตากแดด', 'ที่แห้ง เย็น ไม่โดนแสงแดด โดยพ้นมือเด็ก', 'ในห้องน้ำชื้น', 'ในช่องแช่แข็งเสมอ'], answer: 1, explain: 'เก็บที่แห้งเย็น พ้นแสงแดดและมือเด็ก ยกเว้นยาที่ระบุเป็นอย่างอื่น', difficulty: 'easy', questionType: 'mcq' },

  // --- วันหมดอายุ ---
  { id: 'q30', topicId: 'cat_expiry', q: 'เมื่อยาหมดอายุแล้วควรทำอย่างไร?', options: ['กินต่อได้ถ้าดูปกติ', 'ไม่ควรใช้ และทิ้งอย่างถูกต้อง', 'แบ่งให้เพื่อน', 'เก็บไว้ใช้ครั้งหน้า'], answer: 1, explain: 'ยาหมดอายุอาจลดประสิทธิภาพหรืออันตราย ควรทิ้งถูกวิธี', difficulty: 'easy', questionType: 'mcq' },

  // --- ปฏิกิริยาอาหาร-ยา ---
  { id: 'q31', topicId: 'cat_interaction', q: 'การดื่มแอลกอฮอล์ขณะใช้ยาบางชนิดอันตรายเพราะ?', options: ['ทำให้อยากอาหาร', 'อาจเสริมฤทธิ์กดประสาทหรือทำลายตับ', 'ทำให้ยาหวานขึ้น', 'ไม่มีผลใดๆ'], answer: 1, explain: 'แอลกอฮอล์มีปฏิกิริยากับยาหลายชนิด เพิ่มอันตราย', difficulty: 'medium', questionType: 'mcq' },

  // --- ความรู้ทั่วไปตัวอย่าง ---
  { id: 'q32', topicId: 'cat_general', q: 'อวัยวะใดทำหน้าที่สูบฉีดเลือด?', options: ['ตับ', 'หัวใจ', 'ไต', 'ปอด'], answer: 1, explain: 'หัวใจทำหน้าที่สูบฉีดเลือดไปเลี้ยงร่างกาย', difficulty: 'easy', questionType: 'mcq' },
  { id: 'q33', topicId: 'cat_science', q: 'น้ำเดือดที่ระดับน้ำทะเลมีอุณหภูมิประมาณเท่าใด?', options: ['50 °C', '100 °C', '0 °C', '37 °C'], answer: 1, explain: 'น้ำเดือดที่ความดันบรรยากาศมาตรฐานประมาณ 100 องศาเซลเซียส', difficulty: 'easy', questionType: 'mcq' },
  { id: 'q34', topicId: 'cat_math', q: '15 + 27 เท่ากับเท่าใด?', options: ['32', '42', '52', '41'], answer: 1, explain: '15+27 = 42', difficulty: 'easy', questionType: 'mcq' },
  { id: 'q35', topicId: 'cat_health', q: 'การล้างมือช่วยป้องกันอะไร?', options: ['ผมร่วง', 'การแพร่กระจายเชื้อโรค', 'สายตาสั้น', 'ฟันผุโดยตรง'], answer: 1, explain: 'ล้างมือลดการแพร่เชื้อโรคได้อย่างมีประสิทธิภาพ', difficulty: 'easy', questionType: 'mcq' }
];
