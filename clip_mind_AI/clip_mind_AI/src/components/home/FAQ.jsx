import { useState } from "react";
import { Link } from "react-router-dom";
import { FAQS } from "../../lib/site";

/** Accordion FAQ — one panel open at a time. */
function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <section className="bg-slate-900 py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center">
          Frequently asked questions
        </h2>
        <p className="text-center text-gray-400 mt-4">
          Formats, languages, accuracy and privacy — answered.
        </p>

        <div className="mt-12 space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 text-left px-6 py-5 hover:bg-slate-900/60 transition"
                >
                  <span className="font-semibold">{item.q}</span>
                  <span
                    className={`text-blue-400 text-xl shrink-0 transition-transform ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <p className="px-6 pb-5 text-gray-400 leading-relaxed text-sm">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-gray-400 mt-10 text-sm">
          Still have a question?{" "}
          <Link to="/contact" className="text-blue-400 hover:underline">
            Get in touch
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

export default FAQ;
