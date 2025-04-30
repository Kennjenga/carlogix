"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-slate-50 border-b border-blue-100 relative z-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 z-0"></div>

      <div className="container mx-auto px-6 py-4 flex justify-between items-center relative z-10">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <div className="relative">
              <span className="text-xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-500">
                NEURO_CAR
              </span>
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-transparent"></span>
            </div>
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          {["Home", "Dashboard", "mymech", "mechanics", "Marketplace"].map(
            (item) => (
              <Link
                key={item} // Use item as key for stability if order changes
                href={
                  item === "Home"
                    ? "/"
                    : `/${item.toLowerCase().replace(" ", "")}`
                }
                className="text-slate-700 hover:text-blue-600 transition font-mono text-sm relative group"
              >
                <span>{item.toUpperCase()}</span>
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            )
          )}

          <div className="relative pl-6 ml-2 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-8 before:w-px before:bg-blue-100">
            <ConnectButton
              showBalance={false}
              chainStatus="icon"
              accountStatus="avatar"
            />
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden flex items-center text-slate-700 hover:text-blue-600 transition"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden absolute w-full bg-slate-50 border-b border-blue-100 shadow-lg transition-all duration-300 ease-in-out z-10 ${
          mobileMenuOpen
            ? "max-h-96 py-4 opacity-100" // Increased max-h slightly
            : "max-h-0 py-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="container mx-auto px-6 flex flex-col space-y-4">
          {["Home", "Dashboard", "mymech", "mechanics", "Marketplace"].map(
            (item) => (
              <Link
                key={item} // Use item as key
                href={
                  item === "Home"
                    ? "/"
                    : `/${item.toLowerCase().replace(" ", "")}`
                }
                className="text-slate-700 hover:text-blue-600 transition font-mono py-2 border-b border-slate-100 last:border-0"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-blue-500 mr-2">›</span>
                {item.toUpperCase()}
              </Link>
            )
          )}

          <div className="py-2">
            <ConnectButton
              showBalance={false}
              chainStatus="icon"
              accountStatus="avatar"
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
