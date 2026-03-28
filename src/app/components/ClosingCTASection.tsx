import logoImg from '../../assets/3bf85ad3821c19cb83ca7268914f3d9ba7a2eab8.png';
import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, Mail, CalendarDays } from 'lucide-react';

export function ClosingCTASection() {
  return (
    <section className="relative py-32 md:py-40 lg:py-48 flex flex-col items-center justify-center text-center overflow-hidden bg-[#000000] border-t border-white/[0.04]">
      {/* Cinematic glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.06)_0%,transparent_70%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(255,255,255,0.02)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-[480px] md:max-w-[680px] lg:max-w-[800px] mx-auto px-6 md:px-10 flex flex-col items-center">
        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-20%' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-16 h-16 mb-10"
        >
          <div className="absolute inset-0 bg-white/10 blur-xl rounded-full" />
          <div className="relative w-full h-full rounded-[20px] bg-[#0a0a0a] border border-white/20 flex items-center justify-center shadow-2xl backdrop-blur-md">
            <Sparkles className="w-7 h-7 text-white/90" strokeWidth={1.5} />
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-[2rem] md:text-[2.8rem] lg:text-[3.4rem] font-bold tracking-tight text-white leading-tight mb-5"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Invest in the future of
          <br />
          interactive narrative.
        </motion.h2>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-[15px] md:text-[16px] text-white/45 leading-relaxed font-light mb-12 max-w-[520px]"
        >
          Join Naravo AI and build the next content format for the short-video generation — where every user is the protagonist.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <div className="relative group w-full sm:w-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-white/30 via-white/10 to-white/30 rounded-xl blur-md opacity-30 group-hover:opacity-100 transition duration-700" />
            <button className="relative flex items-center justify-center gap-3 w-full sm:w-auto sm:px-8 py-4 rounded-xl bg-white text-black font-bold text-[15px] hover:bg-white/90 transition-all shadow-[0_0_40px_rgba(255,255,255,0.15)] active:scale-[0.98] whitespace-nowrap">
              Partner with Naravo AI
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <button className="flex items-center gap-2 w-full sm:w-auto sm:px-6 py-4 rounded-xl bg-white/[0.04] border border-white/10 text-white/60 hover:text-white hover:bg-white/[0.08] hover:border-white/15 transition-all text-[14px] font-medium justify-center whitespace-nowrap">
            <CalendarDays className="w-4 h-4" />
            Schedule a Call
          </button>
        </motion.div>

        {/* Contact line */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-10 flex items-center gap-2 text-white/25 hover:text-white/50 transition-colors cursor-pointer"
        >
          <Mail className="w-3.5 h-3.5" />
          <span className="text-[12px] font-medium tracking-wide">Tucanajoy@gmail.com</span>
        </motion.div>

        {/* Footer strip */}
        <div className="mt-16 md:mt-20 pt-8 border-t border-white/[0.04] w-full flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-6 h-6">
              <img
                src={logoImg}
                alt="Naravo AI Logo"
                className="w-6 h-6 object-contain"
                style={{ filter: 'invert(1)', borderRadius: '3px' }}
              />
            </div>
            <span
              className="text-white/50 font-bold tracking-[0.15em] text-[12px] uppercase"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Naravo AI
            </span>
          </div>
          <p className="text-[11px] text-white/20 text-center sm:text-right">
            © 2026 Naravo AI · Confidential Investor Demo · All rights reserved
          </p>
        </div>
      </div>
    </section>
  );
}
