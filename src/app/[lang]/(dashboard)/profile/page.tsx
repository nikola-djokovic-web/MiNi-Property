"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Upload, User, Lock, Save } from "lucide-react";
import PageHeader from "@/components/page-header";
import { useTranslation } from "@/hooks/use-translation";

export default function ProfilePage() {
    const { user, updateUser } = useCurrentUser();
  const { toast } = useToast();
  const router = useRouter();
  const { dict } = useTranslation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/en/login");
      return;
    }
    
    setName(user.name || "");
    setEmail(user.email || "");
    setProfileImage(user.profileImage || "");
  }, [user, router]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: dict?.common?.fileTooLarge || "File too large",
          description: dict?.common?.fileTooLargeDescription || "Please select an image smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setProfileImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/account/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          name: name.trim(),
          profileImage: profileImage.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      const { user: updatedUser } = await response.json();

      // Update local user state
      updateUser({ name: updatedUser.name, profileImage: updatedUser.profileImage });

      toast({
        title: dict?.profile?.profileUpdated || "Profile updated",
        description: dict?.profile?.profileUpdatedDescription || "Your profile has been updated successfully.",
        variant: "default",
        className: "bg-green-50 border-green-200 text-green-900",
      });
    } catch (error: any) {
      toast({
        title: dict?.profile?.updateFailed || "Update Failed",
        description: error.message || (dict?.profile?.updateProfileFailedDescription || "Failed to update profile"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!user) return;
    
    if (!currentPassword || !newPassword) {
      toast({
        title: dict?.common?.validationError || "Validation Error",
        description: dict?.profile?.fillAllPasswordFields || "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: dict?.common?.validationError || "Validation Error",
        description: dict?.profile?.passwordsDoNotMatch || "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: dict?.common?.validationError || "Validation Error",
        description: dict?.profile?.passwordMinLength || "New password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }

      toast({
        title: dict?.profile?.passwordUpdated || "Password updated",
        description: dict?.profile?.passwordUpdatedDescription || "Your password has been changed successfully.",
        variant: "default",
        className: "bg-green-50 border-green-200 text-green-900",
      });

      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: dict?.profile?.passwordChangeFailed || "Password Change Failed",
        description: error.message || (dict?.profile?.passwordChangeFailedDescription || "Failed to change password"),
        variant: "destructive",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) {
    return <div>{dict?.common?.loading || "Loading..."}</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={dict?.profile?.title || "Profile"}
        description={dict?.profile?.description || "Manage your account settings and preferences."}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Profile Information Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {dict?.profile?.personalInfo || "Personal Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar Section */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profileImage || undefined} alt={name || email} />
                <AvatarFallback className="bg-muted text-muted-foreground">
                  {(name?.charAt(0) || email.charAt(0)).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="profileImage">{dict?.profile?.profilePhoto || "Profile Photo"}</Label>
                <Input
                  id="profileImage"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="cursor-pointer mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {dict?.profile?.profilePhotoHint || "Upload a photo or keep the default avatar with your initials."}
                </p>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid gap-3">
              <div>
                <Label htmlFor="name">{dict?.profile?.nameLabel || "Name"}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={dict?.profile?.namePlaceholder || "Enter your full name"}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">{dict?.profile?.emailLabel || "Email"}</Label>
                <Input
                  id="email"
                  value={email}
                  disabled
                  className="bg-muted mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {dict?.profile?.emailCannotBeChanged || "Email cannot be changed. Contact an administrator if needed."}
                </p>
              </div>
            </div>

            <Button
              onClick={handleProfileUpdate}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? (dict?.profile?.updating || "Updating...") : (dict?.profile?.updateProfile || "Update Profile")}
            </Button>
          </CardContent>
        </Card>

        {/* Password Change Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {dict?.profile?.changePassword || "Change Password"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="currentPassword">{dict?.profile?.currentPassword || "Current Password"}</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={dict?.profile?.currentPasswordPlaceholder || "Enter current password"}
                className="mt-1"
              />
            </div>
            <div className="grid gap-3">
              <div>
                <Label htmlFor="newPassword">{dict?.profile?.newPassword || "New Password"}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={dict?.profile?.newPasswordPlaceholder || "Min 8 characters"}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">{dict?.profile?.confirmPassword || "Confirm New Password"}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={dict?.profile?.confirmPasswordPlaceholder || "Confirm password"}
                  className="mt-1"
                />
              </div>
            </div>

            <Button
              onClick={handlePasswordChange}
              disabled={passwordLoading}
              className="w-full sm:w-auto"
            >
              <Lock className="h-4 w-4 mr-2" />
              {passwordLoading ? (dict?.profile?.updating || "Updating...") : (dict?.profile?.updatePassword || "Update Password")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}