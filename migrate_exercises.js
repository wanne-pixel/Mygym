import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('에러: VITE_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 .env에 필요합니다.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrate() {
    try {
        const rawData = fs.readFileSync('./src/data/exercises.json', 'utf8');
        const exercises = JSON.parse(rawData);
        
        const mappedData = exercises.map(ex => ({
            id: ex.id,
            name: ex.name,
            name_en: ex.name_en || null,
            body_part: ex.bodyPart,
            equipment: ex.equipment,
            target: ex.target,
            sub_target_ko: ex.subTarget_ko || null,
            sub_target_en: ex.subTarget_en || null,
            secondary_muscles: ex.secondaryMuscles || [],
            instructions: ex.instructions || [],
            gif_url: ex.gif_url
        }));

        console.log(`마이그레이션 시작: ${mappedData.length}개 항목`);

        const BATCH_SIZE = 100;
        for (let i = 0; i < mappedData.length; i += BATCH_SIZE) {
            const batch = mappedData.slice(i, i + BATCH_SIZE);
            const { error } = await supabase.from('exercises').upsert(batch);
            if (error) throw error;
            console.log(`진행률: ${Math.min(i + BATCH_SIZE, mappedData.length)}/${mappedData.length}`);
        }
        console.log('성공적으로 모든 데이터가 Supabase에 저장되었습니다.');
    } catch (err) {
        console.error('마이그레이션 실패:', err.message);
    }
}

migrate();
