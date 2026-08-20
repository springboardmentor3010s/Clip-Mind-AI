"use client";

function getStrength(password) {
  if (!password) return { label: "", score: 0, color: "" };

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { label: "Weak", score: 1, color: "bg-red-500" };
  if (score <= 3) return { label: "Medium", score: 2, color: "bg-amber" };
  return { label: "Strong", score: 3, color: "bg-teal" };
}

export default function PasswordStrength({ password }) {
  if (!password) return null;
  const { label, score, color } = getStrength(password);

  return (
    <div className="mt-1.5">
      <div className="flex gap-1.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= score ? color : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <p
        className={`text-xs mt-1 font-medium ${
          score === 1 ? "text-red-500" : score === 2 ? "text-amber" : "text-teal"
        }`}
      >
        {label}
      </p>
    </div>
  );
}