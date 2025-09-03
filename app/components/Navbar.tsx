"use client";

import { useEffect, useState } from "react"; // sorry kebanyakan w edit :v
import { supabase } from "@/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Upload,
  LogIn,
  User,
  BadgeCheck,
  FileText,
  Shield,
  Mail,
  Info,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [showMobileSearch, setShowMobileSearch] = useState(false);
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
      setShowMobileSearch(false);
    }
  };

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/">
          <span className="text-xl font-bold text-red-600">NyanStream</span>
        </Link>

        {/* Search Desktop */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex items-center w-1/2 max-w-lg"
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
            className="bg-gray-100 border border-gray-300 border-l-0 rounded-r-full px-4 py-1 hover:bg-gray-200 flex items-center justify-center"
          >
            <Search className="w-5 h-5 text-gray-700" />
          </button>
        </form>

        {/* Right Menu */}
        <div className="flex items-center gap-4 relative">
          {/* Mobile Search Trigger */}
          <div className="md:hidden">
            {!showMobileSearch ? (
              <button onClick={() => setShowMobileSearch(true)}>
                <Search className="w-6 h-6 text-gray-700" />
              </button>
            ) : null}

            <AnimatePresence>
              {showMobileSearch && (
                <motion.form
                  key="mobile-search"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleSearch}
                  className="absolute top-14 right-2 flex items-center w-[200px] sm:w-[250px] bg-white shadow-md rounded-full px-2 py-1"
                >
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                    className="w-full border-0 focus:outline-none px-2"
                  />
                  <button
                    type="submit"
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <Search className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMobileSearch(false)}
                    className="p-1 rounded-full hover:bg-gray-100 ml-1"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Upload Button */}
          <Link
            href="/upload"
            className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 flex items-center justify-center"
          >
            <Upload className="w-5 h-5" />
          </Link>

          {/* User Menu */}
          {user ? (
            <div className="relative">
              <div
                className="w-9 h-9 rounded-full overflow-hidden border cursor-pointer"
                onClick={() => setDropdownOpen((prev) => !prev)}
              >
                <Image
                  src={
                    profile?.avatar_url
                      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_url}`
                      : `https://ui-avatars.com/api/?name=${
                          profile?.username || "User"
                        }`
                  }
                  alt={profile?.username || "User"}
                  width={36}
                  height={36}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              </div>

              {/* Dropdown dengan animasi + icon */}
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    key="user-dropdown"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border origin-top-right"
                  >
                    <ul className="py-2 text-sm text-gray-700">
                      <li>
                        <Link
                          href={`/${profile?.username}`}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 group"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <motion.div
                            whileHover={{ x: 4 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <User className="w-4 h-4 text-gray-600" />
                          </motion.div>
                          Profile
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/verified-request"
                          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 group"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <motion.div whileHover={{ x: 4 }}>
                            <BadgeCheck className="w-4 h-4 text-gray-600" />
                          </motion.div>
                          Verified Request
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/terms"
                          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 group"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <motion.div whileHover={{ x: 4 }}>
                            <FileText className="w-4 h-4 text-gray-600" />
                          </motion.div>
                          Terms of Service
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/privacy"
                          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 group"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <motion.div whileHover={{ x: 4 }}>
                            <Shield className="w-4 h-4 text-gray-600" />
                          </motion.div>
                          Privacy Policy
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/contact"
                          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 group"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <motion.div whileHover={{ x: 4 }}>
                            <Mail className="w-4 h-4 text-gray-600" />
                          </motion.div>
                          Contact Developer
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/about"
                          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 group"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <motion.div whileHover={{ x: 4 }}>
                            <Info className="w-4 h-4 text-gray-600" />
                          </motion.div>
                          About Us
                        </Link>
                      </li>
                    </ul>
                    <div className="border-t">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-gray-100 group"
                      >
                        <motion.div whileHover={{ x: 4 }}>
                          <LogOut className="w-4 h-4" />
                        </motion.div>
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href="/auth"
              className="bg-gray-200 p-2 rounded-full hover:bg-gray-300 flex items-center justify-center"
            >
              <LogIn className="w-5 h-5 text-gray-700" />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
