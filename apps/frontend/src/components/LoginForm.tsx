import { useState, type FormEvent } from "react";

export default function LoginForm() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    try {
      console.log("Login function");
      // const { success, error } = await login(identifier, password);

      // if (!success) {
      //   alert("Login failed: " + (error || "Unknown error"));
      // } else {
      //   alert("Login successful!");
      //   window.location.href = "/chats";
      // }
    } catch (error: any) {
      console.error("Login error:", error);
      alert("Login error: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4 mb-5">
      <div>
        <label
          htmlFor="identifier"
          className="block text-sm font-medium text-gray-700"
        >
          Email / Username
        </label>
        <input
          id="identifier"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="w-full px-4 py-2 mt-1 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
          placeholder="Enter your email or username"
          required
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 mt-1 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-400 bg-gray-50"
          placeholder="Enter your password"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full px-4 py-2 text-white bg-orange-400 rounded-md hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-400"
      >
        Login
      </button>
    </form>
  );
}
