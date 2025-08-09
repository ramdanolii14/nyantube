// authHandler.ts
import { supabase } from "@/lib/supabaseClient";

/**
 * Register user baru dengan limit 2 akun per IP
 */
export async function registerUser(
  username: string,
  channelName: string,
  email: string,
  password: string
) {
  try {
    // 1. Ambil IP publik
    const ipRes = await fetch("https://api64.ipify.org?format=json");
    const { ip } = await ipRes.json();

    // 2. Cek jumlah akun dari IP ini
    const { data: ipData, error: ipCheckError } = await supabase
      .from("ip_registers")
      .select("id")
      .eq("ip_addresses", ip);

    if (ipCheckError) throw ipCheckError;
    if (ipData.length >= 2) {
      return { success: false, message: "❌ Maksimal 2 akun per IP." };
    }

    // 3. Signup ke auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) throw signUpError;
    const userId = signUpData.user?.id;
    if (!userId) throw new Error("User ID tidak ditemukan setelah signup.");

    // 4. Insert ke profiles (id = auth.users.id)
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        username,
        channel_name: channelName,
        avatar_url: null,
      });

    if (profileError) throw profileError;

    // 5. Simpan IP ke ip_registers
    const { error: ipInsertError } = await supabase
      .from("ip_registers")
      .insert({
        id: crypto.randomUUID(),
        ip_addresses: ip,
      });

    if (ipInsertError) throw ipInsertError;

    return { success: true, message: "✅ Registrasi berhasil." };
  } catch (err: any) {
    console.error("Register Error:", err);
    return { success: false, message: err.message || "Terjadi kesalahan." };
  }
}

/**
 * Login user + ambil profilnya
 */
export async function loginUser(email: string, password: string) {
  try {
    // 1. Login ke auth
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) throw loginError;
    const userId = loginData.user?.id;
    if (!userId) throw new Error("User ID tidak ditemukan setelah login.");

    // 2. Ambil profil user
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError) throw profileError;

    return {
      success: true,
      message: "✅ Login berhasil.",
      profile,
    };
  } catch (err: any) {
    console.error("Login Error:", err);
    return { success: false, message: err.message || "Terjadi kesalahan." };
  }
}
