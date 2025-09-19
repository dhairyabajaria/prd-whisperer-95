import ErrorPageTemplate from "@/components/error-page-template";
import { WifiIcon } from "lucide-react";

interface NetworkErrorPageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function NetworkErrorPage({ 
  title, 
  message, 
  onRetry 
}: NetworkErrorPageProps) {
  return (
    <ErrorPageTemplate
      type="network"
      title={title}
      message={message}
      customActions={onRetry ? [
        {
          label: "Try Again",
          onClick: onRetry,
          variant: "default",
          icon: <WifiIcon className="w-4 h-4" />,
        }
      ] : []}
    />
  );
}