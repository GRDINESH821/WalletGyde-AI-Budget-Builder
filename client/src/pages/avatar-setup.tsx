import { useState } from "react";
import { Upload, User, Sparkles, ArrowRight, Camera, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const AVATAR_OPTIONS = [
  {
    id: "friendly-human-1",
    name: "Friendly Face",
    type: "human",
    preview: "👨‍💼"
  },
  {
    id: "professional-human-1", 
    name: "Professional",
    type: "human",
    preview: "👩‍💼"
  },
  {
    id: "wise-owl",
    name: "Wise Owl",
    type: "animal",
    preview: "🦉"
  },
  {
    id: "clever-fox",
    name: "Clever Fox", 
    type: "animal",
    preview: "🦊"
  },
  {
    id: "trustworthy-bear",
    name: "Trustworthy Bear",
    type: "animal", 
    preview: "🐻"
  },
  {
    id: "smart-elephant",
    name: "Smart Elephant",
    type: "animal",
    preview: "🐘"
  }
];

export default function AvatarSetupPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [avatarType, setAvatarType] = useState<"generated" | "uploaded">("generated");

  const generateAvatarMutation = useMutation({
    mutationFn: async (avatarId: string) => {
      const response = await apiRequest("POST", "/api/generate-avatar", { avatarId });
      return response.json();
    },
    onSuccess: (data) => {
      completeOnboarding(data.avatarUrl);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate avatar. Please try again.",
        variant: "destructive",
      });
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      });
      return response.json();
    },
    onSuccess: (data) => {
      completeOnboarding(data.avatarUrl);
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    },
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: async (avatarUrl: string) => {
      const response = await apiRequest("POST", "/api/complete-onboarding", { avatarUrl });
      return response.json();
    },
    onSuccess: () => {
      window.location.href = "/chat";
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete setup. Please try again.",
        variant: "destructive",
      });
    },
  });

  const completeOnboarding = (avatarUrl: string) => {
    completeOnboardingMutation.mutate(avatarUrl);
  };

  const handleAvatarSelect = (avatarId: string) => {
    setSelectedAvatar(avatarId);
    setAvatarType("generated");
    setUploadedImage(null);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please choose an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        setAvatarType("uploaded");
        setSelectedAvatar(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProceed = () => {
    if (avatarType === "generated" && selectedAvatar) {
      generateAvatarMutation.mutate(selectedAvatar);
    } else if (avatarType === "uploaded" && uploadedImage) {
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = input?.files?.[0];
      if (file) {
        const formData = new FormData();
        formData.append("avatar", file);
        uploadAvatarMutation.mutate(formData);
      }
    }
  };

  const isLoading = generateAvatarMutation.isPending || uploadAvatarMutation.isPending || completeOnboardingMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(221,83%,53%)] via-[hsl(221,83%,45%)] to-[hsl(158,64%,52%)] flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-6 sm:p-8 my-4"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[hsl(221,83%,53%)] rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome to Walletgyde AI!</h1>
          <p className="text-gray-600">Let's set up your avatar to personalize your experience</p>
        </div>

        {/* Avatar Options */}
        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Choose Your Avatar</h2>
          
          {/* Generated Avatars */}
          <div className="mb-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-3">AI-Generated Avatars</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {AVATAR_OPTIONS.map((avatar) => (
                <motion.button
                  key={avatar.id}
                  onClick={() => handleAvatarSelect(avatar.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedAvatar === avatar.id
                      ? "border-[hsl(221,83%,53%)] bg-[hsl(221,83%,53%)]/10"
                      : "border-gray-200 hover:border-[hsl(221,83%,53%)]/50"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-4xl mb-2">{avatar.preview}</div>
                  <p className="text-sm font-medium text-gray-700">{avatar.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{avatar.type}</p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Upload Option */}
          <div className="mb-6">
            <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-3">Upload Your Own</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 sm:p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="avatar-upload"
              />
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer block"
              >
                {uploadedImage ? (
                  <div className="space-y-3">
                    <img
                      src={uploadedImage}
                      alt="Uploaded avatar"
                      className="w-20 h-20 rounded-full object-cover mx-auto"
                    />
                    <p className="text-sm text-gray-600">Click to change image</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-gray-700">Upload Your Photo</p>
                      <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
                    </div>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Image Guidelines */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 mb-1">Image Guidelines</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Use professional, appropriate photos only</li>
                  <li>• Clear face shots work best for avatar recognition</li>
                  <li>• No inappropriate, offensive, or copyrighted content</li>
                  <li>• Images are processed securely and used only for your avatar</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <Button
            onClick={handleProceed}
            disabled={(!selectedAvatar && !uploadedImage) || isLoading}
            className="flex-1 bg-[hsl(221,83%,53%)] hover:bg-[hsl(221,83%,45%)] text-white py-3"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Setting up...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>Proceed to Chat</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}