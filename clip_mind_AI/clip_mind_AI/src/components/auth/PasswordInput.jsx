import { useState } from "react";

function PasswordInput({
  label = "Password",
  name = "password",
  placeholder = "Enter your password",
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="mb-5">

      <label className="block text-gray-700 font-medium mb-2">
        {label}
      </label>

      <div className="relative">

        <input
          type={showPassword ? "text" : "password"}
          name={name}
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
        >
          {showPassword ? "🙈" : "👁️"}
        </button>

      </div>

    </div>
  );
}

export default PasswordInput;