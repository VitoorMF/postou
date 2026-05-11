"use client";

import { useEffect } from "react";

export default function LandingScripts() {
  useEffect(() => {
    // nav scrolled state
    const nav = document.getElementById("nav");
    const onScroll = () => {
      if (nav) nav.classList.toggle("scrolled", window.scrollY > 12);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // estado inicial

    // hamburger toggle
    const ham = document.getElementById("hamburger");
    const root = document.getElementById("landing-root");
    const onHam = () => root?.classList.toggle("menu-open");
    ham?.addEventListener("click", onHam);

    // mobile nav links fecham o menu
    const mobileLinks = document.querySelectorAll<HTMLAnchorElement>(".mobile-nav a");
    const closeMenu = () => root?.classList.remove("menu-open");
    mobileLinks.forEach((a) => a.addEventListener("click", closeMenu));

    // reveal IntersectionObserver
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -40px 0px" }
    );
    const revealEls = document.querySelectorAll(".reveal, .stagger");
    revealEls.forEach((el) => io.observe(el));

    // smooth scroll pra anchors internas (não interfere com Link)
    const anchors = document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');
    const onAnchorClick = (ev: Event) => {
      const a = ev.currentTarget as HTMLAnchorElement;
      const id = a.getAttribute("href");
      if (id && id.length > 1) {
        const el = document.querySelector(id);
        if (el) {
          ev.preventDefault();
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    };
    anchors.forEach((a) => a.addEventListener("click", onAnchorClick));

    return () => {
      window.removeEventListener("scroll", onScroll);
      ham?.removeEventListener("click", onHam);
      mobileLinks.forEach((a) => a.removeEventListener("click", closeMenu));
      anchors.forEach((a) => a.removeEventListener("click", onAnchorClick));
      io.disconnect();
    };
  }, []);

  return null;
}
