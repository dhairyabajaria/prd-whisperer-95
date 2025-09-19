import ErrorPageTemplate from "@/components/error-page-template";
import { ClockIcon } from "lucide-react";

interface MaintenancePageProps {
  title?: string;
  message?: string;
  estimatedCompletion?: string;
  statusUrl?: string;
}

export default function MaintenancePage({ 
  title, 
  message, 
  estimatedCompletion,
  statusUrl = "https://status.company.com"
}: MaintenancePageProps) {
  const handleCheckStatus = () => {
    window.open(statusUrl, '_blank');
  };

  return (
    <ErrorPageTemplate
      type="maintenance"
      title={title}
      message={message}
      details={estimatedCompletion ? `Estimated completion: ${estimatedCompletion}` : undefined}
      showGoBack={false}
      customActions={[
        {
          label: "Check Status",
          onClick: handleCheckStatus,
          variant: "outline",
          icon: <ClockIcon className="w-4 h-4" />,
        }
      ]}
    />
  );
}