import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
// import { useState } from "react";
import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-xl font-bold text-blue-700">NeuroCar</span>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <Link
            href="/"
            className="text-gray-800 hover:text-blue-600 transition"
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className="text-gray-800 hover:text-blue-600 transition"
          >
            Dashboard
          </Link>
          <Link
            href="/mymech"
            className="text-gray-800 hover:text-blue-600 transition"
          >
            Digi Mechanic
          </Link>

          <ConnectButton
            accountStatus={{
              smallScreen: "avatar",
              largeScreen: "full",
            }}
          />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
