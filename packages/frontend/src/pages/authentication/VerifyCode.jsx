import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import loginImg from "../../assets/login.png"; 

export default function VerifyCode() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Verify code:", code);
    navigate("/reset-password");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex w-full max-w-4xl p-8 bg-white shadow-xl rounded-xl">
        
       
        <div className="w-1/2 pr-8">
        <h1 className="text-xl font-semibold text-gray-800 mb-6">Your Logo</h1>
          <h2 className="text-2xl font-bold text-gray-800">Verify Code</h2>
          <p className="mt-2 text-sm text-gray-500">
            Enter the verification code we sent to your email.
          </p>

          <form className="space-y-4 mt-6" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Enter code"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Verify
            </button>
          </form>
        </div>

        
        <div className="w-1/2 flex items-center justify-center">
          <img src={loginImg} alt="Illustration" className="w-3/4" />
        </div>
      </div>
    </div>
  );
}
