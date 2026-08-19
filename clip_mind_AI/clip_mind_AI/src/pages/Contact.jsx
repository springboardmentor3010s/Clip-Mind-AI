import { useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { API_ROOT } from "../lib/api";
import { CONTACT_EMAIL } from "../lib/site";

const EMPTY = { name: "", email: "", subject: "", message: "" };

/**
 * Public contact page.
 *
 * Posts to the unauthenticated /contact endpoint using a bare axios client —
 * the shared `api` instance attaches a JWT and redirects to /login on 401,
 * which is wrong for a visitor who has no account.
 */
function Contact() {
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setFieldErrors((fe) => ({ ...fe, [field]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError("");
    setFieldErrors({});

    try {
      const res = await axios.post(`${API_ROOT}/api/v1/contact`, form);
      if (res.data.success) {
        setSent(true);
        setForm(EMPTY);
      }
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 429) {
        setError("Too many messages sent from this address. Please try again later.");
      } else if (data?.errors) {
        setFieldErrors(data.errors);
        setError(data.message || "Please correct the errors below.");
      } else {
        setError(data?.message || "Could not send your message. Please try again.");
      }
    } finally {
      setSending(false);
    }
  };

  const fieldClass = (field) =>
    `w-full bg-slate-950 border rounded-xl px-4 py-3 outline-none transition ${
      fieldErrors[field] ? "border-red-600 focus:border-red-500" : "border-slate-700 focus:border-blue-500"
    }`;

  // A plain render helper rather than a nested component — defining a
  // component inside render remounts it on every keystroke.
  const fieldError = (field) =>
    fieldErrors[field] ? (
      <p className="text-red-400 text-xs mt-1">{[].concat(fieldErrors[field])[0]}</p>
    ) : null;

  return (
    <div className="bg-slate-950 text-white min-h-screen">
      <Navbar />

      <header className="pt-36 pb-12 px-6 text-center">
        <span className="bg-blue-600/20 text-blue-400 px-4 py-2 rounded-full text-sm">
          Get in touch
        </span>
        <h1 className="mt-6 text-4xl md:text-5xl font-extrabold">Contact us</h1>
        <p className="mt-4 text-gray-400 max-w-xl mx-auto">
          Questions about the platform, a bug to report, or feedback on the AI
          output — send it over and we'll get back to you.
        </p>
      </header>

      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">

          {/* Sidebar */}
          <aside className="space-y-5">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <span className="text-2xl">📧</span>
              <h3 className="font-bold mt-3">Email us</h3>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="text-blue-400 hover:underline text-sm break-all"
              >
                {CONTACT_EMAIL}
              </a>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <span className="text-2xl">⏱️</span>
              <h3 className="font-bold mt-3">Response time</h3>
              <p className="text-gray-400 text-sm mt-1">
                We aim to reply within two working days.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <span className="text-2xl">💡</span>
              <h3 className="font-bold mt-3">Quick answers</h3>
              <p className="text-gray-400 text-sm mt-1">
                Formats, languages, accuracy and privacy are covered in the{" "}
                <a href="/#faq" className="text-blue-400 hover:underline">FAQ</a>.
              </p>
            </div>
          </aside>

          {/* Form */}
          <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-7">
            {sent ? (
              <div className="text-center py-14">
                <p className="text-5xl mb-4">✅</p>
                <h2 className="text-2xl font-bold">Message received</h2>
                <p className="text-gray-400 mt-3 max-w-sm mx-auto">
                  Thanks for reaching out — we've got your message and will reply
                  to the address you provided.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-7 bg-slate-800 hover:bg-slate-700 px-6 py-2.5 rounded-xl font-semibold transition"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                {error && (
                  <div className="mb-5 bg-red-950/40 border border-red-900 text-red-300 rounded-xl p-4 text-sm">
                    {error}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Your name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      value={form.name}
                      onChange={update("name")}
                      required
                      className={fieldClass("name")}
                      placeholder="Jane Doe"
                    />
                    {fieldError("name")}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={update("email")}
                      required
                      className={fieldClass("email")}
                      placeholder="you@example.com"
                    />
                    {fieldError("email")}
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor="subject" className="block text-sm font-medium mb-2">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="subject"
                    value={form.subject}
                    onChange={update("subject")}
                    required
                    className={fieldClass("subject")}
                    placeholder="What is this about?"
                  />
                  {fieldError("subject")}
                </div>

                <div className="mt-4">
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    rows={7}
                    value={form.message}
                    onChange={update("message")}
                    required
                    className={`${fieldClass("message")} resize-y`}
                    placeholder="Tell us what you need…"
                  />
                  <div className="flex justify-between mt-1">
                    {fieldError("message")}
                    <span className="text-xs text-gray-600 ml-auto">
                      {form.message.length} / 5000
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-6 py-3.5 rounded-xl font-semibold transition"
                >
                  {sending ? "Sending…" : "Send message"}
                </button>

                <p className="text-xs text-gray-600 mt-4 text-center">
                  We only use your email to reply to this enquiry.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Contact;
