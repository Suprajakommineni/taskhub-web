import { useEffect, useRef, useState } from 'react';
import { KeyRound, Loader2, User as UserIcon, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getMe, uploadMyPhoto, changeMyPassword, type Me } from '../lib/userapi';
import { initials, photoUrl } from '../lib/utils';

export default function Settings() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    getMe()
      .then(setMe)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handlePhotoChange(file: File | null) {
    if (!file) return;
    setUploading(true);
    setPhotoError('');
    try {
      const updated = await uploadMyPhoto(file);
      setMe(updated);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setPasswordSaving(true);
    try {
      await changeMyPassword(newPassword, currentPassword || undefined);
      setPasswordSuccess('Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setPasswordSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your profile and account security.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserIcon className="h-4 w-4" />
              Profile photo
            </CardTitle>
            <CardDescription>This is what teammates see on tasks and project cards.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative">
                {me?.profilePhoto ? (
                  <img
                    src={photoUrl(me.profilePhoto)}
                    alt=""
                    className="h-16 w-16 rounded-full object-cover ring-1 ring-border"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary ring-1 ring-border">
                    {initials(me?.username || me?.email || '?')}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -right-1 -bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm ring-2 ring-background"
                  aria-label="Change photo"
                >
                  {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  className="sr-only"
                  onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{me?.username}</p>
                <p className="truncate text-xs text-muted-foreground">{me?.email}</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading…' : 'Upload new photo'}
                </Button>
              </div>
            </div>
            {photoError && <p className="mt-3 text-sm text-destructive">{photoError}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4" />
              Change password
            </CardTitle>
            <CardDescription>
              {me?.email ? 'Choose a new password for your account.' : 'Set a password for your account.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Leave blank if you signed up with Google"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
              {passwordSuccess && <p className="text-sm text-emerald-600 dark:text-emerald-400">{passwordSuccess}</p>}

              <Button type="submit" disabled={passwordSaving || !newPassword}>
                {passwordSaving ? 'Saving…' : 'Update password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
