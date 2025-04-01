"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-hidden">
      {/* Cyberpunk Grid Background */}
      <div className="fixed inset-0 z-0 opacity-10">
        <div className="absolute inset-0 bg-grid-pattern"></div>
      </div>

      {/* Hero Section */}
      <div className="relative min-h-screen overflow-hidden">
        {/* Animated Glitch Effect */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-400/20 to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-3/4 h-3/4 bg-gradient-to-tl from-cyan-400/20 to-transparent"></div>
          <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-blue-500/30 blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-500/20 blur-3xl"></div>
        </div>

        {/* Digital Circuit Lines */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <svg
            className="absolute top-0 left-0 w-full h-full opacity-10"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0 L100,0 L100,100 L0,100 Z"
              fill="none"
              stroke="#4299e1"
              strokeWidth="0.1"
            />
            <path
              d="M0,20 L100,20"
              fill="none"
              stroke="#4299e1"
              strokeWidth="0.1"
            />
            <path
              d="M0,40 L100,40"
              fill="none"
              stroke="#4299e1"
              strokeWidth="0.1"
            />
            <path
              d="M0,60 L100,60"
              fill="none"
              stroke="#4299e1"
              strokeWidth="0.1"
            />
            <path
              d="M0,80 L100,80"
              fill="none"
              stroke="#4299e1"
              strokeWidth="0.1"
            />
            <path
              d="M20,0 L20,100"
              fill="none"
              stroke="#4299e1"
              strokeWidth="0.1"
            />
            <path
              d="M40,0 L40,100"
              fill="none"
              stroke="#4299e1"
              strokeWidth="0.1"
            />
            <path
              d="M60,0 L60,100"
              fill="none"
              stroke="#4299e1"
              strokeWidth="0.1"
            />
            <path
              d="M80,0 L80,100"
              fill="none"
              stroke="#4299e1"
              strokeWidth="0.1"
            />
          </svg>
        </div>

        <div className="container mx-auto px-6 relative z-10 flex flex-col justify-center h-screen">
          <div className="max-w-3xl">
            <div className="inline-block mb-4 px-4 py-1 bg-blue-100 border-l-4 border-blue-500 text-blue-700 font-mono">
              NEURO_CAR::SYSTEM_ONLINE
            </div>
            <h1 className="text-6xl font-bold leading-tight mb-6 glitch-text">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400">
                Neural Vehicle Interface
              </span>
            </h1>
            <p className="text-xl mb-8 font-light text-slate-700 max-w-2xl">
              NeuroCar provides a secure, transparent digital logbook for your
              vehicle with
              <span className="text-blue-600 font-semibold">
                {" "}
                blockchain technology
              </span>
              . Manage maintenance records, verify history, and access
              decentralized insurance pools.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-mono rounded-md transition duration-300 text-center relative overflow-hidden group"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                <span className="relative z-10">EXPLORE_DASHBOARD</span>
              </Link>
              <Link
                href="/mymech"
                className="px-8 py-4 bg-slate-100 border-2 border-blue-500 hover:bg-blue-50 text-blue-600 font-mono rounded-md transition duration-300 text-center"
              >
                DIGITAL_MECHANIC
              </Link>
            </div>
          </div>
        </div>

        {/* Animated Down Arrow */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
          <svg
            className="w-8 h-8 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            ></path>
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white relative">
        <div className="absolute inset-0 bg-grid-blue-pattern opacity-5"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block px-3 py-1 bg-blue-100 text-blue-600 font-mono text-sm mb-3">
              SYSTEM_FEATURES
            </div>
            <h2 className="text-4xl font-bold text-slate-800">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                Why Choose NeuroCar?
              </span>
            </h2>
            <p className="text-slate-600 mt-2 max-w-2xl mx-auto">
              Comprehensive vehicle management in the blockchain era
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="bg-slate-50 rounded-lg p-8 hover:shadow-lg transition duration-300 border border-slate-200 hover:border-blue-300 group">
              <div className="bg-blue-100 p-3 rounded-lg w-16 h-16 flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <svg
                  className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2 font-mono">
                IMMUTABLE_RECORDS
              </h3>
              <p className="text-slate-600">
                All maintenance records, issue reports, and history are securely
                stored on the blockchain, ensuring transparency and preventing
                fraud.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 rounded-lg p-8 hover:shadow-lg transition duration-300 border border-slate-200 hover:border-blue-300 group">
              <div className="bg-blue-100 p-3 rounded-lg w-16 h-16 flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <svg
                  className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2 font-mono">
                DECENTRALIZED_INSURANCE
              </h3>
              <p className="text-slate-600">
                Join community-based insurance pools with lower premiums,
                transparent claims processing, and community oversight.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 rounded-lg p-8 hover:shadow-lg transition duration-300 border border-slate-200 hover:border-blue-300 group">
              <div className="bg-blue-100 p-3 rounded-lg w-16 h-16 flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <svg
                  className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2 font-mono">
                TOKENIZED_OWNERSHIP
              </h3>
              <p className="text-slate-600">
                Your vehicle is represented as an NFT, providing proof of
                ownership, simplified transfers, and increased resale value
                through verified history.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 bg-slate-100 relative">
        <div className="absolute inset-0 bg-circuit-pattern opacity-5"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block px-3 py-1 bg-blue-100 text-blue-600 font-mono text-sm mb-3">
              SYSTEM_PROTOCOL
            </div>
            <h2 className="text-4xl font-bold text-slate-800">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                How It Works
              </span>
            </h2>
            <p className="text-slate-600 mt-2">
              Simple steps to digitize your vehicle on the blockchain
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((step, index) => (
              <div key={index} className="text-center relative">
                <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white w-14 h-14 rounded-lg flex items-center justify-center mx-auto mb-6 text-xl font-bold relative overflow-hidden">
                  <div className="absolute inset-0 bg-blue-600 animate-pulse opacity-50"></div>
                  <span className="relative z-10">{step}</span>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-7 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-500 to-blue-300"></div>
                )}
                <h3 className="text-xl font-semibold mb-2 font-mono">
                  {index === 0 && "MINT_CAR_NFT"}
                  {index === 1 && "RECORD_MAINTENANCE"}
                  {index === 2 && "JOIN_INSURANCE"}
                  {index === 3 && "DIGITAL_MECH"}
                </h3>
                <p className="text-slate-600">
                  {index === 0 &&
                    "Register your vehicle details and create a unique NFT"}
                  {index === 1 &&
                    "Add service records, repairs, and issue reports"}
                  {index === 2 &&
                    "Opt into community-based decentralized insurance"}
                    {index === 3 &&
                    "Use maintenance records and issue reports with our AI to diagnose the issue"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-blue-500 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <svg
            className="absolute inset-0 h-full w-full"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="grid-pattern"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-pattern)" />
          </svg>
        </div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="inline-block px-3 py-1 bg-white/20 text-white font-mono text-sm mb-3 backdrop-blur-sm">
            SYSTEM_INVITATION
          </div>
          <h2 className="text-4xl font-bold mb-4">
            Ready to Revolutionize Your Vehicle Ownership?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of vehicle owners who have already digitized their
            vehicles with NeuroCar&apos;s blockchain technology.
          </p>
          <div className="inline-block backdrop-blur-sm bg-white/10 p-2 rounded-lg">
            <ConnectButton
              accountStatus={{
                smallScreen: "avatar",
                largeScreen: "full",
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 relative">
        <div className="absolute inset-0 bg-circuit-pattern opacity-5"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 font-mono text-blue-400">
                NEURO_CAR
              </h3>
              <p className="text-slate-400">
                Revolutionizing vehicle ownership and management with blockchain
                technology.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 font-mono text-blue-400">
                QUICK_LINKS
              </h4>
              <ul className="space-y-2">
                {["Home", "Dashboard", "Marketplace", "Insurance"].map(
                  (item, index) => (
                    <li key={index}>
                      <Link
                        href={index === 0 ? "/" : `/${item.toLowerCase()}`}
                        className="text-slate-400 hover:text-blue-400 transition flex items-center"
                      >
                        <span className="text-blue-500 mr-2">›</span> {item}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 font-mono text-blue-400">
                RESOURCES
              </h4>
              <ul className="space-y-2">
                {["FAQs", "Blog", "Support", "Documentation"].map(
                  (item, index) => (
                    <li key={index}>
                      <Link
                        href={`/${item.toLowerCase()}`}
                        className="text-slate-400 hover:text-blue-400 transition flex items-center"
                      >
                        <span className="text-blue-500 mr-2">›</span> {item}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 font-mono text-blue-400">
                CONTACT
              </h4>
              <p className="text-slate-400 mb-2 font-mono">info@neurocar.io</p>
              <div className="flex space-x-4 mt-4">
                {["twitter", "instagram", "facebook"].map((social, index) => (
                  <a
                    key={index}
                    href="#"
                    className="text-slate-400 hover:text-blue-400 transition bg-slate-800 p-2 rounded-md hover:bg-slate-700"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {social === "twitter" && (
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
                      )}
                      {social === "instagram" && (
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path>
                      )}
                      {social === "facebook" && (
                        <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"></path>
                      )}
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-500">
            <p className="font-mono">© 2025 NEURO_CAR. ALL_RIGHTS_RESERVED.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
