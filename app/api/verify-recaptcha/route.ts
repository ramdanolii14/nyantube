// app/api/verify-recaptcha/route.ts
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  if (!token) {
    return new Response(JSON.stringify({ success: false, message: "Token tidak ada" }), {
      status: 400,
    });
  }

  const secret = process.env.RECAPTCHA_SECRET_KEY;
  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `secret=${secret}&response=${token}`,
  });

  const data = await response.json();

  if (!data.success || data.score < 0.5) {
    return new Response(JSON.stringify({ success: false, message: "Gagal validasi reCAPTCHA" }), {
      status: 400,
    });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
