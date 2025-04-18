import axios from "axios";
import { useState } from "react";

const LoginForm = () => {
  const [formData, setFormData] = useState({ identifier: "", password: "" });

  async function handleSubmit() {
    try {
      const response = await axios.post(
        `${import.meta.env.PUBLIC_SERVER_API_AUTH_URL}/signin`,
        formData
      );

      const { message, failed } = response.data;
      if (failed) {
        alert("One wierd error occurred!");
        return;
      }

      alert(message || "Login successful");
      window.location.href = "/chats";
    } catch (error: any) {
      console.error(error.message);
      alert(error.response.data.message);
    }
  }
  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email / Username
        </label>
        <input
          id="email"
          name="email"
          onChange={(e) =>
            setFormData({ ...formData, identifier: e.target.value })
          }
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
          type="password"
          id="password"
          name="password"
          onChange={(e) =>
            setFormData({ ...formData, identifier: e.target.value })
          }
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
};

export default LoginForm;
