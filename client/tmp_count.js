import { createClient } from '@supabase/supabase-client'
import * as dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.log('Missing env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCount() {
    const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

    if (error) console.error(error)
    else console.log('Total Profiles Count:', count)
}

checkCount()
