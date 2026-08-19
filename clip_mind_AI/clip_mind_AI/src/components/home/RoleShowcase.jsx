import { Link } from "react-router-dom";
import { ROLE_SHOWCASE } from "../../lib/site";

/**
 * Explains what each of the four roles can do. Doubles as a plain-language
 * reference for the platform's access-control model.
 */
function RoleShowcase() {
  return (
    <section className="bg-slate-950 py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center">Built for four roles</h2>
        <p className="text-center text-gray-400 mt-4 max-w-2xl mx-auto">
          Everyone sees a workspace shaped around what they actually do. Pick your
          role when you register — an administrator can change it later.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-14">
          {ROLE_SHOWCASE.map((r) => (
            <div
              key={r.role}
              className={`bg-slate-900 border ${r.ring} rounded-2xl p-7 hover:border-opacity-100 transition`}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{r.icon}</span>
                <div>
                  <h3 className={`text-2xl font-bold ${r.color}`}>{r.role}</h3>
                  <p className="text-sm text-gray-500">{r.tagline}</p>
                </div>
              </div>

              <ul className="mt-5 space-y-2">
                {r.points.map((p) => (
                  <li key={p} className="flex gap-2.5 text-sm text-gray-300">
                    <span className="text-emerald-400 shrink-0">✓</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/register"
            className="inline-block bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-xl font-semibold transition"
          >
            Choose your role and get started
          </Link>
        </div>
      </div>
    </section>
  );
}

export default RoleShowcase;
