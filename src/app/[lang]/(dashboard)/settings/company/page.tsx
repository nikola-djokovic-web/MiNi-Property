"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyLogo } from "@/components/ui/mini-property-logo";
import { Upload, X } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useToast } from "@/hooks/use-toast";

export default function CompanySettingsPage() {
  const { user, updateUser } = useCurrentUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [companyName, setCompanyName] = useState(user?.companyName || "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(user?.companyLogo || null);

  // Update local state when user data changes
  useEffect(() => {
    if (user) {
      setCompanyName(user.companyName || "");
      setLogoPreview(user.companyLogo || null);
    }
  }, [user]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (PNG, JPG, SVG, etc.)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setLogoFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleDeleteLogo = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/company-settings', {
        method: 'DELETE',
        headers: {
          'user-id': user?.id || '',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete logo');
      }
      
      // Update user context immediately
      if (updateUser) {
        updateUser({
          companyLogo: undefined,
        });
      }
      
      setLogoPreview(null);
      setLogoFile(null);
      
      toast({
        title: "Logo deleted",
        description: "Your company logo has been removed successfully.",
      });
      
    } catch (error) {
      console.error('Error deleting logo:', error);
      toast({
        title: "Error deleting logo",
        description: "There was a problem deleting your logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      let logoUrl = logoPreview;
      
      // If there's a new file, upload it first
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload logo');
        }
        
        const uploadResult = await uploadResponse.json();
        logoUrl = uploadResult.url;
      }
      
      // Save company settings
      const response = await fetch('/api/company-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user?.id || '',
        },
        body: JSON.stringify({
          companyName,
          companyLogo: logoUrl,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save company settings');
      }
      
      // Update user context with new data immediately
      if (updateUser) {
        updateUser({
          companyName,
          companyLogo: logoUrl || undefined,
        });
      }
      
      // Clear the file state since it's now saved
      setLogoFile(null);
      setLogoPreview(logoUrl);
      
      toast({
        title: "Settings saved",
        description: "Your company settings have been updated successfully.",
      });
      
    } catch (error) {
      console.error('Error saving company settings:', error);
      toast({
        title: "Error saving settings",
        description: "There was a problem saving your company settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Only admins can access company settings
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access company settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            Update your company name and logo. The logo will appear at the top of the sidebar and clicking it will navigate to the dashboard. The MiNi Property logo will always remain at the bottom of the sidebar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter your company name"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              This name will appear in the sidebar and throughout the application.
            </p>
          </div>

          <div className="space-y-4">
            <Label>Company Logo</Label>
            
            {/* Logo Preview */}
            <div className="flex items-center gap-4">
              <div className="border-2 border-dashed border-muted rounded-lg p-4">
                <CompanyLogo
                  logoUrl={logoPreview}
                  companyName={companyName || "Company"}
                  size="lg"
                  fallback={false}
                />
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {logoPreview ? 'Change Logo' : 'Upload Logo'}
                  </Button>
                  
                  {logoPreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveLogo}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  )}
                  
                  {user?.companyLogo && !logoFile && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleDeleteLogo}
                      disabled={isLoading}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Delete Current
                    </Button>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Recommended: Square image, at least 128x128px. Max file size: 5MB.
                  Supported formats: PNG, JPG, SVG, WebP. Logo will be clickable and navigate to dashboard.
                </p>
              </div>
            </div>

            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSave} 
              disabled={isLoading}
              className="min-w-24"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            See how your company branding will appear in the sidebar. The logo will be clickable and navigate to the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Sidebar Preview</h4>
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="flex flex-col items-center gap-2">
                  <CompanyLogo 
                    logoUrl={logoPreview}
                    companyName={companyName || "Company"}
                    size="lg"
                  />
                  {companyName && (
                    <span className="text-xs text-center text-muted-foreground font-medium leading-tight">
                      {companyName.length > 12 
                        ? `${companyName.slice(0, 12)}...` 
                        : companyName
                      }
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}