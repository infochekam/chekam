#!/usr/bin/env node

/**
 * Script to promote a user to admin role
 * Usage: node promote-admin.js <email>
 * Example: node promote-admin.js afa.abyem@gmail.com
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.argv[2];

if (!EMAIL) {
  console.error("Usage: node promote-admin.js <email>");
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function promoteToAdmin() {
  try {
    console.log(`Promoting user with email: ${EMAIL}...`);

    // 1. Find user by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const user = users.find((u) => u.email === EMAIL);
    if (!user) {
      console.error(`User with email "${EMAIL}" not found.`);
      process.exit(1);
    }

    console.log(`Found user: ${user.id} (${user.email})`);

    // 2. Check if user already has admin role
    const { data: existingRole, error: checkError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (checkError) throw checkError;

    if (existingRole && existingRole.length > 0) {
      console.log(`User ${EMAIL} is already an admin.`);
      process.exit(0);
    }

    // 3. Insert admin role
    const { error: insertError } = await supabase
      .from("user_roles")
      .insert({ user_id: user.id, role: "admin" });

    if (insertError) throw insertError;

    console.log(`✓ Successfully promoted ${EMAIL} to admin!`);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

promoteToAdmin();
