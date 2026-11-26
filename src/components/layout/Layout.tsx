import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MidnightAtmosphere from "./MidnightAtmosphere";
import CommandInterface from "../ui/CommandInterface";
import ResumeProtocol from "../ui/ResumeProtocol";
import { profile } from "../../lib/profile";
import { useMidnightRealm } from "../../context/MidnightRealmContext";

interface LayoutProps {
  children: React.ReactNode;
  fullBleedHero?: boolean;
}

export default function Layout({ children, fullBleedHero = false }: LayoutProps) {
  const { isResumeOpen, closeResume, resumeSource } = useMidnightRealm();

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#08090D] text-[#F0F2F8]">
      <MidnightAtmosphere />
      <Navbar />
      <CommandInterface />

      <main
        className={
          fullBleedHero
            ? "relative z-10 w-full grow pb-8"
            : "relative z-10 mx-auto w-full max-w-7xl grow px-4 pt-20 pb-8 md:px-8 md:pt-24"
        }
      >
        {children}
      </main>

      <Footer />

      <ResumeProtocol
        isOpen={isResumeOpen}
        onClose={closeResume}
        source={resumeSource}
        fallbackResumeUrl={profile.resumeUrl}
      />
    </div>
  );
}
