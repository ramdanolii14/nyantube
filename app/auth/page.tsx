"use client";

import { useState } from "react";
import Login from "./login";
import Register from "./register";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
        {mode === "login" ? (
          <>
            <Login />
            <p
              className="text-center text-blue-600 mt-4 cursor-pointer"
              onClick={() => setMode("register")}
            >
              Belum punya akun? Daftar di sini
            </p>
          </>
        ) : (
          <>
            <Register />
            <p
              className="text-center text-blue-600 mt-4 cursor-pointer"
              onClick={() => setMode("login")}
            >
              Sudah punya akun? Login di sini
            </p>
          </>
        )}
      </div>
    </div>
  );
}
