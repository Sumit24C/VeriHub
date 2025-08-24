import { useState } from "react";

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    verificationCode: ""
  });
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 1) {
      if (!form.name || !form.email || !form.password || !form.confirmPassword) {
        setError("Please fill all fields.");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      setError("");
      setStep(2);
    } else {
      if (!form.verificationCode) {
        setError("Please enter the verification code.");
        return;
      }
      setError("");
      // Simulate successful signup
      alert("Signup successful! You can now log in.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">Sign Up</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 ? (
            <>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Name</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Confirm Password</label>
                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Verification Code</label>
                <input type="text" name="verificationCode" value={form.verificationCode} onChange={handleChange} className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                <p className="text-xs text-gray-500 mt-2">A verification code has been sent to your email.</p>
              </div>
            </>
          )}
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition">
            {step === 1 ? "Next" : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
}
