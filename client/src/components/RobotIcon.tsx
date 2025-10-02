import { Bot } from "lucide-react";

interface RobotIconProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  useCustomIcon?: boolean;
  customIconPath?: string;
}

export default function RobotIcon({ 
  className = "", 
  size = "md", 
  useCustomIcon = false,
  customIconPath = "/icons/robot-icon.png"
}: RobotIconProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5", 
    lg: "w-8 h-8"
  };

  if (useCustomIcon && customIconPath) {
    return (
      <>
        <img 
          src={customIconPath} 
          alt="Robot Icon"
          className={`${sizeClasses[size]} ${className}`}
          onError={(e) => {
            console.log('Custom robot icon failed to load:', customIconPath);
            e.currentTarget.style.display = 'none';
          }}
          onLoad={() => {
            console.log('Custom robot icon loaded successfully:', customIconPath);
          }}
        />
        <Bot 
          className={`${sizeClasses[size]} ${className}`} 
          style={{display: 'none'}}
          onLoad={(e) => {
            const img = e.currentTarget.previousElementSibling as HTMLImageElement;
            if (img && img.style.display === 'none') {
              e.currentTarget.style.display = 'block';
            }
          }}
        />
      </>
    );
  }

  return <Bot className={`${sizeClasses[size]} ${className}`} />;
}
