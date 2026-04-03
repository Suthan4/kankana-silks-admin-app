import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  label?: string;
  href?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  label = "",
  href,
  className = "",
}) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => (href ? navigate(href) : navigate(-1))}
      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
    >
      <ArrowLeft className="h-5 w-5" />
      {label}
    </button>
  );
};
