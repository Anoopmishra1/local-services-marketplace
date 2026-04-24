/**
 * One-time script to create an admin user.
 * Run:  node seed-admin.js
 */
require('dotenv').config();
const supabase = require('./src/config/supabase');

const ADMIN_EMAIL = 'admin@localapp.in';
const ADMIN_PASSWORD = 'Admin@123456';
const ADMIN_NAME = 'Admin';

async function seedAdmin() {
    console.log('🔧 Creating admin account...\n');

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
    });

    if (authError) {
        // If user already exists in auth, try to find them
        if (authError.message.includes('already been registered')) {
            console.log('⚠️  Auth user already exists. Checking users table...');

            const { data: existing } = await supabase
                .from('users')
                .select('*')
                .eq('email', ADMIN_EMAIL)
                .single();

            if (existing) {
                // Make sure role is admin
                if (existing.role !== 'admin') {
                    await supabase.from('users').update({ role: 'admin' }).eq('id', existing.id);
                    console.log('✅ Updated existing user role to admin.\n');
                } else {
                    console.log('✅ Admin account already exists!\n');
                }
            } else {
                console.log('❌ Auth user exists but no row in users table. Please check Supabase manually.\n');
            }

            printCredentials();
            return;
        }

        console.error('❌ Auth error:', authError.message);
        process.exit(1);
    }

    // 2. Insert into users table with role = 'admin'
    const { error: dbError } = await supabase
        .from('users')
        .insert({
            id: authData.user.id,
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            role: 'admin',
        });

    if (dbError) {
        console.error('❌ DB error:', dbError.message);
        process.exit(1);
    }

    console.log('✅ Admin account created successfully!\n');
    printCredentials();
}

function printCredentials() {
    console.log('┌──────────────────────────────────────┐');
    console.log('│  📧 Email:    ' + ADMIN_EMAIL.padEnd(23) + '│');
    console.log('│  🔑 Password: ' + ADMIN_PASSWORD.padEnd(22) + '│');
    console.log('└──────────────────────────────────────┘');
    console.log('\nUse these credentials at http://localhost:3000/login');
}

seedAdmin().catch(console.error);
