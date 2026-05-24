import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/UI/StatusBadge';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const { register: regProfile, handleSubmit: handleProfile, formState: { errors: profileErrors } } = useForm({
    defaultValues: { name: user?.name || '', avatar: user?.avatar || '' },
  });

  const { register: regPassword, handleSubmit: handlePassword, reset: resetPassword, watch, formState: { errors: passwordErrors } } = useForm();
  const newPassword = watch('newPassword');

  const onProfileSubmit = async (data) => {
    setProfileLoading(true);
    try {
      const res = await api.put('/auth/profile', data);
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setPasswordLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed!');
      resetPassword();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile info card */}
      <div className="card">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{user?.name}</h3>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            <div className="mt-1">
              <StatusBadge status={user?.role} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <User size={16} className="text-primary-400" />
          <h4 className="font-medium text-slate-200">Edit Profile</h4>
        </div>

        <form onSubmit={handleProfile(onProfileSubmit)} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input
              className="input"
              {...regProfile('name', { required: 'Name is required', maxLength: { value: 50, message: 'Max 50 chars' } })}
            />
            {profileErrors.name && <p className="text-red-400 text-xs mt-1">{profileErrors.name.message}</p>}
          </div>
          <div>
            <label className="label">Avatar URL (optional)</label>
            <input className="input" placeholder="https://..." {...regProfile('avatar')} />
          </div>
          <button type="submit" disabled={profileLoading} className="btn-primary">
            <Save size={15} />
            {profileLoading ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Change password card */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={16} className="text-primary-400" />
          <h4 className="font-medium text-slate-200">Change Password</h4>
        </div>

        <form onSubmit={handlePassword(onPasswordSubmit)} className="space-y-4">
          <div>
            <label className="label">Current password</label>
            <input
              type="password"
              className="input"
              placeholder="Enter current password"
              {...regPassword('currentPassword', { required: 'Current password is required' })}
            />
            {passwordErrors.currentPassword && (
              <p className="text-red-400 text-xs mt-1">{passwordErrors.currentPassword.message}</p>
            )}
          </div>
          <div>
            <label className="label">New password</label>
            <input
              type="password"
              className="input"
              placeholder="At least 6 characters"
              {...regPassword('newPassword', {
                required: 'New password is required',
                minLength: { value: 6, message: 'Minimum 6 characters' },
              })}
            />
            {passwordErrors.newPassword && (
              <p className="text-red-400 text-xs mt-1">{passwordErrors.newPassword.message}</p>
            )}
          </div>
          <div>
            <label className="label">Confirm new password</label>
            <input
              type="password"
              className="input"
              placeholder="Repeat new password"
              {...regPassword('confirmPassword', {
                required: 'Please confirm your password',
                validate: (val) => val === newPassword || 'Passwords do not match',
              })}
            />
            {passwordErrors.confirmPassword && (
              <p className="text-red-400 text-xs mt-1">{passwordErrors.confirmPassword.message}</p>
            )}
          </div>
          <button type="submit" disabled={passwordLoading} className="btn-primary">
            <Lock size={15} />
            {passwordLoading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
