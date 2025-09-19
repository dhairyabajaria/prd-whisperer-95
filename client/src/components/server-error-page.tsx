import ErrorPageTemplate from "@/components/error-page-template";
import { MailIcon } from "lucide-react";

interface ServerErrorPageProps {
  title?: string;
  message?: string;
  errorId?: string;
  supportEmail?: string;
}

export default function ServerErrorPage({ 
  title, 
  message, 
  errorId,
  supportEmail = "support@company.com"
}: ServerErrorPageProps) {
  const handleContactSupport = () => {
    const subject = `Error Report${errorId ? ` - ID: ${errorId}` : ''}`;
    const body = `Please describe what you were doing when this error occurred.\n\nError ID: ${errorId || 'N/A'}\nTimestamp: ${new Date().toISOString()}`;
    window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <ErrorPageTemplate
      type="server"
      title={title}
      message={message}
      details={errorId ? `Error ID: ${errorId}` : undefined}
      customActions={[
        {
          label: "Contact Support",
          onClick: handleContactSupport,
          variant: "outline",
          icon: <MailIcon className="w-4 h-4" />,
        }
      ]}
    />
  );
}