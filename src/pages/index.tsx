import React from "react";
import SEO from "../components/seo/SEO";
import Layout from "../components/layout/Layout";
import Hero from "../components/sections/Hero";
import About from "../components/sections/About";
import Roadmap from "../components/sections/Roadmap";
import TechArsenal from "../components/sections/TechArsenal";
import Projects from "../components/sections/Projects";
import Certifications from "../components/sections/Certifications";
import AnimeFeed from "../components/sections/AnimeFeed";
import SignalLogs from "../components/sections/SignalLogs";
import Contact from "../components/sections/Contact";
import { SITE_URL } from "../lib/site";
import { profile } from "../lib/profile";
import { siteSettings } from "../lib/content/siteSettings";

export default function Home() {
  return (
    <>
      <SEO
        title={`ByteProwler | ${profile.role}`}
        description={`I'm ${profile.realName}, a frontend developer building clean, responsive websites and thoughtful digital experiences. Available for work and collaboration.`}
        url="/"
        structuredData={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Person",
              "@id": `${SITE_URL}/#person`,
              name: profile.realName,
              alternateName: "ByteProwler",
              jobTitle: profile.role,
              url: SITE_URL,
              sameAs: [siteSettings.githubUrl, siteSettings.linkedinUrl],
            },
            {
              "@type": "WebSite",
              "@id": `${SITE_URL}/#website`,
              name: "ByteProwler",
              url: SITE_URL,
              author: { "@id": `${SITE_URL}/#person` },
            },
          ],
        }}
        image="/og-byteprowler.jpg"
      />

      <Layout fullBleedHero>
        <Hero />
        <div className="mx-auto w-full max-w-7xl px-4 pt-6 md:px-8">
          <About />
          <div id="expertise" className="scroll-mt-24">
            <TechArsenal />
          </div>
          <Projects />
          <div id="experience" className="scroll-mt-24">
            <Roadmap />
            <Certifications />
          </div>
          <div id="playground" className="scroll-mt-24">
            <AnimeFeed />
            <SignalLogs />
          </div>
          <Contact />
        </div>
      </Layout>
    </>
  );
}
