import ErrorPageTemplate from "@/components/error-page-template";
import { LogIn, UserPlus } from "lucide-react";
import { useLocation } from "wouter";

interface UnauthorizedPageProps {
  title?: string;
  message?: string;
  showSignUp?: boolean;
}

export default function UnauthorizedPage({ 
  title, 
  message, 
  showSignUp = true 
}: UnauthorizedPageProps) {
  const [, navigate] = useLocation();

  const handleSignIn = () => {
    navigate("/login");
  };

  const handleSignUp = () => {
    navigate("/signup");
  };

   const customActions: Array<{
     label: string;
     onClick: () => void;
     variant: "default" | "outline" | "ghost" | "secondary" | "destructive" | "link";
     icon: React.ReactNode;
   }> = [
     {
       label: "Sign In",
       onClick: handleSignIn,
       variant: "default",
       icon: <LogIn className="w-4 h-4" />,
     }
   ];

   if (showSignUp) {
     customActions.push({
       label: "Create Account",
       onClick: handleSignUp,
       variant: "outline",
       icon: <UserPlus className="w-4 h-4" />,
     });
   }

  return (
    <ErrorPageTemplate
      type="unauthorized"
      title={title}
      message={message}
      showGoBack={false}
      showRefresh={false}
      customActions={customActions}
    />
  );
}