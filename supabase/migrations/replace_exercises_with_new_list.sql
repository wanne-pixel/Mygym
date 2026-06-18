-- Replace exercises with the new curated list

DELETE FROM exercises;

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0001',
  '시티드 로우',
  'Seated Row',
  '등',
  '머신',
  '등 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0002',
  'M시티드 로우',
  'M Seated Row',
  '등',
  '머신',
  '등 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0003',
  '프론트 로우',
  'Front Row',
  '등',
  '머신',
  '등 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0004',
  '와이드 풀다운',
  'Wide Pulldown',
  '등',
  '머신',
  '등 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0005',
  '로우 로우',
  'Low Row',
  '등',
  '머신',
  '등 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0006',
  '와이드 랫풀다운',
  'Wide Lat Pulldown',
  '등',
  '머신',
  '등 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0007',
  '클로즈 랫풀다운',
  'Close Lat Pulldown',
  '등',
  '머신',
  '등 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0008',
  '어시스트 풀업',
  'Assist Pull Up',
  '등',
  '머신',
  '등 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0009',
  '클로즈 롱풀',
  'Close Long Pull',
  '등',
  '머신',
  '등 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0010',
  '와이드 롱풀',
  'Wide Long Pull',
  '등',
  '머신',
  '등 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0011',
  '리버스 펙덱플라이',
  'Reverse Pec Deck Fly',
  '등',
  '머신',
  '등 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0012',
  '벤트오버 로우',
  'Bentover Row',
  '등',
  '덤벨',
  '등 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0013',
  '원암 로우',
  'One Arm Row',
  '등',
  '덤벨',
  '등 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0014',
  '벤트오버 로우',
  'Smith Bentover Row',
  '등',
  '스미스 머신',
  '등 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0015',
  '슈러그',
  'Smith Shrug',
  '등',
  '스미스 머신',
  '등 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0016',
  '벤트오버 로우',
  'Barbell Bentover Row',
  '등',
  '바벨',
  '등 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0017',
  '암 풀 다운',
  'Cable Straight Arm Pulldown',
  '등',
  '케이블',
  '등 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0018',
  '체스트 프레스머신',
  'Chest Press Machine',
  '가슴',
  '머신',
  '가슴 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0019',
  '펙덱플라이',
  'Pec Deck Fly',
  '가슴',
  '머신',
  '가슴 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0020',
  'M펙덱플라이',
  'M Pec Deck Fly',
  '가슴',
  '머신',
  '가슴 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0021',
  '인클라인 프레스',
  'Incline Press',
  '가슴',
  '머신',
  '가슴 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0022',
  '디클라인 프레스',
  'Decline Press',
  '가슴',
  '머신',
  '가슴 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0023',
  '플랫 프레스',
  'Flat Press',
  '가슴',
  '머신',
  '가슴 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0024',
  '노틸러스프레스',
  'Nautilus Press',
  '가슴',
  '머신',
  '가슴 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0025',
  'M인클라인 프레스',
  'M Incline Press',
  '가슴',
  '머신',
  '가슴 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0026',
  'M디클라인 프레스',
  'M Decline Press',
  '가슴',
  '머신',
  '가슴 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0027',
  '디클라인 프레스',
  'Dumbbell Decline Press',
  '가슴',
  '덤벨',
  '가슴 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0028',
  '인클라인 프레스',
  'Dumbbell Incline Press',
  '가슴',
  '덤벨',
  '가슴 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0029',
  '플랫 프레스',
  'Dumbbell Flat Press',
  '가슴',
  '덤벨',
  '가슴 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0030',
  '풀오버',
  'Dumbbell Pullover',
  '가슴',
  '덤벨',
  '가슴 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0031',
  '디클라인 프레스',
  'Smith Decline Press',
  '가슴',
  '스미스 머신',
  '가슴 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0032',
  '인클라인 프레스',
  'Smith Incline Press',
  '가슴',
  '스미스 머신',
  '가슴 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0033',
  '플랫 프레스',
  'Smith Flat Press',
  '가슴',
  '스미스 머신',
  '가슴 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);



INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0035',
  '인클라인 프레스',
  'Barbell Incline Press',
  '가슴',
  '바벨',
  '가슴 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0036',
  '플랫 프레스',
  'Barbell Flat Press',
  '가슴',
  '바벨',
  '가슴 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0037',
  '하이 플라이',
  'Cable High Fly',
  '가슴',
  '케이블',
  '가슴 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0038',
  '미들 플라이',
  'Cable Middle Fly',
  '가슴',
  '케이블',
  '가슴 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0039',
  '로우 플라이',
  'Cable Low Fly',
  '가슴',
  '케이블',
  '가슴 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0040',
  '리어 펙덱플라이',
  'Rear Pec Deck Fly',
  '어깨',
  '머신',
  '어깨 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0041',
  '숄더 프레스',
  'Shoulder Press',
  '어깨',
  '머신',
  '어깨 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0042',
  'M숄더 프레스',
  'M Shoulder Press',
  '어깨',
  '머신',
  '어깨 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0043',
  '시티드 레트럴레이즈',
  'Seated Lateral Raise',
  '어깨',
  '머신',
  '어깨 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0044',
  '스탠딩 레트럴레이즈',
  'Standing Lateral Raise',
  '어깨',
  '머신',
  '어깨 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0045',
  '벤트오버',
  'Machine Bentover lateral raise',
  '어깨',
  '머신',
  '어깨 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0046',
  '숄더 프레스',
  'Smith Shoulder Press',
  '어깨',
  '스미스 머신',
  '어깨 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0047',
  '업라이트 로우',
  'Smith Upright Row',
  '어깨',
  '스미스 머신',
  '어깨 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0048',
  '숄더 프레스',
  'Barbell Shoulder Press',
  '어깨',
  '바벨',
  '어깨 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0049',
  '프론트 레이즈',
  'Barbell Front Raise',
  '어깨',
  '바벨',
  '어깨 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0050',
  '사이드레트럴 레이즈',
  'Dumbbell Side Lateral Raise',
  '어깨',
  '덤벨',
  '어깨 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0051',
  '숄더 프레스',
  'Dumbbell Shoulder Press',
  '어깨',
  '덤벨',
  '어깨 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);



INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0053',
  '벤트오버',
  'Dumbbell Bentover Lateral Raise',
  '어깨',
  '덤벨',
  '어깨 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0054',
  '페이스풀',
  'Cable Face Pull',
  '어깨',
  '케이블',
  '어깨 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0055',
  '힙 어덕션',
  'Hip Adduction',
  '하체',
  '머신',
  '하체 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0056',
  '힙 어브덕션',
  'Hip Abduction',
  '하체',
  '머신',
  '하체 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0057',
  '레그 익스텐션',
  'Leg Extension',
  '하체',
  '머신',
  '하체 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0058',
  '레그 컬',
  'Leg Curl',
  '하체',
  '머신',
  '하체 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0059',
  '레그프레스',
  'Leg Press',
  '하체',
  '머신',
  '하체 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0060',
  '레그프레스',
  'Sled Leg Press',
  '하체',
  '슬레드 머신',
  '하체 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0061',
  '레그 익스텐션',
  'Sled Leg Extension',
  '하체',
  '슬레드 머신',
  '하체 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0062',
  '원 레그 컬',
  'Sled Single Leg Curl',
  '하체',
  '슬레드 머신',
  '하체 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0063',
  '핵스커트',
  'Hack Squat',
  '하체',
  '슬레드 머신',
  '하체 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0064',
  '파나타 스쿼트',
  'Panatta Squat',
  '하체',
  '슬레드 머신',
  '하체 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0065',
  '힙 킥 익스텐션',
  'Hip Kick Extension',
  '하체',
  '슬레드 머신',
  '하체 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0066',
  '힙 어브덕션',
  'Sled Hip Abduction',
  '하체',
  '슬레드 머신',
  '하체 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0067',
  '힙 쓰러스트',
  'Hip Thrust Machine',
  '하체',
  '슬레드 머신',
  '하체 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0068',
  '데드리프트',
  'Smith Deadlift',
  '하체',
  '스미스 머신',
  '하체 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0069',
  '스쿼트',
  'Smith Squat',
  '하체',
  '스미스 머신',
  '하체 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0070',
  '루마니안 데드리프트',
  'Smith Romanian Deadlift',
  '하체',
  '스미스 머신',
  '하체 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0071',
  '런지',
  'Smith Lunge',
  '하체',
  '스미스 머신',
  '하체 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0072',
  '데드리프트',
  'Barbell Deadlift',
  '하체',
  '바벨',
  '하체 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);



INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0074',
  '루마니안 데드리프트',
  'Barbell Romanian Deadlift',
  '하체',
  '바벨',
  '하체 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0075',
  '컬',
  'Dumbbell Curl',
  '팔',
  '덤벨',
  '팔 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0076',
  '오버헤드 익스텐션',
  'Dumbbell Overhead Extension',
  '팔',
  '덤벨',
  '팔 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0077',
  '컬',
  'Barbell Curl',
  '팔',
  '바벨',
  '팔 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0078',
  '오버헤드 익스텐션',
  'Barbell Overhead Extension',
  '팔',
  '바벨',
  '팔 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0079',
  '컬',
  'Cable Curl',
  '팔',
  '케이블',
  '팔 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0080',
  '푸시다운',
  'Cable Pushdown',
  '팔',
  '케이블',
  '팔 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0081',
  '런닝',
  'Running',
  '유산소',
  '맨몸',
  '유산소 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0082',
  '조깅',
  'Jogging',
  '유산소',
  '맨몸',
  '유산소 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0083',
  '등산',
  'Hiking',
  '유산소',
  '맨몸',
  '유산소 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

INSERT INTO exercises (id, name, name_en, body_part, equipment, target, sub_target_ko, sub_target_en, secondary_muscles, instructions, gif_url) VALUES (
  '0084',
  '싸이클',
  'Cycling',
  '유산소',
  '머신',
  '유산소 근육',
  '전체',
  'All',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL
);

