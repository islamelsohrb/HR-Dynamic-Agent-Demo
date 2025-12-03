

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "light" | "dark";
  type?: "logo" | "icon" | "both"; // NEW
}

export default function Logo({
  className,
  size = "md",
  variant = "default",
  type = "logo",
}: LogoProps) {
  const sizes = {
    sm: "w-9 h-9",
    md: "w-28",
    lg: "w-32 h-32",
  };

  const dimensions = {
    sm: 24,
    md: 150,
    lg: 60,
  };

  // choose what to render
  const showLogo = type === "logo" || type === "both";
  const showIcon = type === "icon" || type === "both";

  const renderImage = (src: any, alt: string) => (
    <div
      className={
        `rounded-xl flex items-center justify-center overflow-hidden shrink-0 ${sizes[size]}`
      }
    >
      <img
        src={src}
        alt={alt}
        width={dimensions[size]}
        height={dimensions[size]}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  );

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {showLogo && renderImage("../assest/images/logo.png", "Delytic Logo")}
      {showIcon && renderImage("../assest/images/icon.png", "Delytic Icon")}
    </div>
  );
}
