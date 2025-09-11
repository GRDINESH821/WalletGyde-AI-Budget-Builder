import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Camera, Star, Upload, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { Link } from "wouter";
import PlaidLink from "@/components/PlaidLink";

const AVATAR_PROMPTS = [
  "A friendly animated fox character with a vibrant scarf, in cartoon style",
  "A playful robot avatar with glowing eyes and a colorful background, Pixar-style",
  "A gender-neutral animated character, joyful and expressive, 2D style",
  "A fantasy dragon avatar with a soft, cute appearance, anime-inspired",
  "A minimalistic owl avatar with big expressive eyes, vector art style",
  "A stylized jellyfish avatar floating in a dreamy ocean scene, Studio Ghibli-inspired",
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to upload avatar");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "Profile picture updated successfully!",
      });
      setSelectedFile(null);
      setPreviewUrl(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile picture. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Generate AI avatar mutation
  const generateAvatarMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/generate-avatar", {
        prompt,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Success",
        description: "AI avatar generated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate AI avatar. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        toast({
          title: "Error",
          description: "File size must be less than 10MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Error",
          description: "Please select a valid image file",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("avatar", selectedFile);
    uploadAvatarMutation.mutate(formData);
  };

  const handleGenerateAvatar = (prompt: string) => {
    generateAvatarMutation.mutate(prompt);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(221,83%,53%)] via-[hsl(221,83%,45%)] to-[hsl(158,64%,52%)] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/chat">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/20 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Chat
            </Button>
          </Link>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Star className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Settings</h1>
              <p className="text-white/80 text-sm sm:text-base">
                Manage your profile and preferences
              </p>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="w-5 h-5" />
              <span>Profile Picture</span>
            </CardTitle>
            <CardDescription>
              Update your profile picture using AI generation or file upload
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Avatar */}
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage
                  src={previewUrl || user?.avatarUrl || user?.profileImageUrl}
                  alt="Profile picture"
                />
                <AvatarFallback className="bg-[hsl(221,83%,53%)] text-white text-lg">
                  {user?.firstName?.[0]?.toUpperCase() ||
                    user?.email?.[0]?.toUpperCase() ||
                    "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.firstName || user?.email?.split("@")[0] || "User"}
                </h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>

            <Separator />

            {/* File Upload Section */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Upload Custom Image</h4>
              <div className="flex items-center space-x-4">
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="flex items-center space-x-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-[hsl(221,83%,53%)] transition-colors">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-medium">Choose File</span>
                  </div>
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  name="avatar"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {selectedFile && (
                  <Button
                    onClick={handleUpload}
                    disabled={uploadAvatarMutation.isPending}
                    className="bg-[hsl(221,83%,53%)] hover:bg-[hsl(221,83%,45%)]"
                  >
                    {uploadAvatarMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Upload"
                    )}
                  </Button>
                )}
              </div>
              {selectedFile && (
                <p className="text-sm text-gray-500">
                  Selected: {selectedFile.name} (
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <Separator />

            {/* AI Avatar Generation */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>Generate AI Avatar</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {AVATAR_PROMPTS.map((prompt, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleGenerateAvatar(prompt)}
                    disabled={generateAvatarMutation.isPending}
                    className="p-3 text-left border rounded-lg hover:border-[hsl(221,83%,53%)] hover:bg-[hsl(221,83%,53%)]/5 transition-colors disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <p className="text-sm font-medium text-gray-900">
                      Style {index + 1}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{prompt}</p>
                  </motion.button>
                ))}
              </div>
              {generateAvatarMutation.isPending && (
                <div className="flex items-center space-x-2 text-[hsl(221,83%,53%)]">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Generating avatar...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Manage your account settings and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = "/api/logout";
              }}
              className="w-full text-red-600 border-red-300 hover:bg-red-50"
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>

        {/* Bank Account Integration */}
        <PlaidLink />
      </div>
    </div>
  );
}
