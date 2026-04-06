const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '/home/vertigo/Compus-connect-1/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpload() {
    console.log("Testing Supabase Uploads...");
    const dummyContent = "Test image content";
    
    for (const bucket of ['hostels', 'showcase', 'avatars']) {
        const { data, error } = await supabase.storage.from(bucket).upload(`test-${Date.now()}.png`, dummyContent, { contentType: 'image/png' });
        if (error) {
            console.error(`❌ Bucket [${bucket}] Failed:`, error.message);
        } else {
            console.log(`✅ Bucket [${bucket}] Success:`, data);
        }
    }
}
testUpload();
