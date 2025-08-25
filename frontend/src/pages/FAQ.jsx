import React from "react";

const FAQ = () => (
  <div className="max-w-2xl mx-auto p-6">
    <h2 className="text-2xl font-bold mb-4">FAQ & Help</h2>
    <div className="mb-4">
      <h3 className="font-semibold">How do I analyze content?</h3>
      <p>Use the main form to submit text or images for analysis. Results will appear in the chat below.</p>
    </div>
    <div className="mb-4">
      <h3 className="font-semibold">How do I sign up or log in?</h3>
      <p>Use the login/signup pages to create an account or access your profile.</p>
    </div>
    <div className="mb-4">
      <h3 className="font-semibold">How do I change my password?</h3>
      <p>Go to your profile page and enter a new password.</p>
    </div>
    <div className="mb-4">
      <h3 className="font-semibold">How do I manage cookie preferences?</h3>
      <p>Click the link in the footer to open the cookie preferences modal.</p>
    </div>
    <div className="mb-4">
      <h3 className="font-semibold">Who can I contact for support?</h3>
      <p>Email support@factguard.ai for help or feedback.</p>
    </div>
  </div>
);

export default FAQ;
