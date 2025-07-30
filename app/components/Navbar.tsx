"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
}

interface Profile {
  username: string;
  avatar_url: string | null;
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser({ id: user.id, email: user.email! });

        const { data } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", user.id)
          .single();

        if (data) {
          setProfile({
            username: data.username,
            avatar_url: data.avatar_url,
          });
        }
      }
    };

    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() !== "") {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/">
          <span className="text-xl font-bold text-red-600">NyanTube</span>
        </Link>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="flex items-center w-1/2 max-w-lg"
        >
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-gray-300 rounded-l-full px-4 py-1 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
          <button
            type="submit"
            className="bg-gray-100 border border-gray-300 border-l-0 rounded-r-full px-4 py-1 hover:bg-gray-200"
          >
            🔍
          </button>
        </form>

        {/* Right Menu */}
        <div className="flex items-center gap-4 relative">
          <Link
            href="/upload"
            className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
          >
            Upload
          </Link>

          {user ? (
            <div className="relative">
              {/* Avatar - fix landscape */}
              <div
                className="w-9 h-9 rounded-full overflow-hidden border cursor-pointer"
                onClick={() => setDropdownOpen((prev) => !prev)}
              >
                <Image
                  src={
                    profile?.avatar_url
                      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_url}`
                      : `https://ui-avatars.com/api/?name=${profile?.username || "User"}`
                  }
                  alt={profile?.username || "User"}
                  width={36}
                  height={36}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              </div>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border">
                  <ul className="py-2 text-sm text-gray-700">
                    <li>
                      <Link
                        href={`/${profile?.username}`}
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Profile
                      </Link>
                    </li>
                     <li>
                      <Link
                        href="/verified-request"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Verified Request
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/terms"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Terms of Service
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/privacy"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Privacy Policy
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/contact"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Contact Developer
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/about"
                        className="block px-4 py-2 hover:bg-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        About Us
                      </Link>
                    </li>
                  </ul>
                  <div className="border-t">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth"
              className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
