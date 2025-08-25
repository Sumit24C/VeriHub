import React, { useState } from "react";

const Profile = () => {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john@example.com",
    password: "",
    social: { google: true, github: false }
  });
  const [newPassword, setNewPassword] = useState("");

  const handleEdit = () => setEditing(true);
  const handleSave = () => {
    setEditing(false);
    // Save logic here
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">User Profile</h2>
      <div className="mb-4">
        <label className="block font-medium">Name</label>
        {editing ? (
          <input className="input" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
        ) : (
          <div>{profile.name}</div>
        )}
      </div>
      <div className="mb-4">
        <label className="block font-medium">Email</label>
        {editing ? (
          <input className="input" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
        ) : (
          <div>{profile.email}</div>
        )}
      </div>
      <div className="mb-4">
        <label className="block font-medium">Change Password</label>
        <input className="input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password" />
      </div>
      <div className="mb-4">
        <label className="block font-medium">Connected Social Accounts</label>
        <div className="flex gap-4">
          <span className={profile.social.google ? "text-green-600" : "text-gray-400"}>Google</span>
          <span className={profile.social.github ? "text-green-600" : "text-gray-400"}>GitHub</span>
        </div>
      </div>
      <div className="flex gap-2">
        {editing ? (
          <button className="btn" onClick={handleSave}>Save</button>
        ) : (
          <button className="btn" onClick={handleEdit}>Edit</button>
        )}
      </div>
    </div>
  );
};

export default Profile;
