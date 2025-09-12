import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  ShieldCheck, 
  BarChart3, 
  Globe,
  Pill,
  Users,
  TrendingUp,
  Clock
} from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Pill className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">PharmaDist ERP</h1>
                <p className="text-sm text-muted-foreground">Pharmaceutical Distribution System</p>
              </div>
            </div>
            <Button 
              onClick={handleLogin}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-login"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-foreground mb-6">
            AI-Powered ERP & CRM for
            <span className="text-primary block mt-2">Pharmaceutical Distribution</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
            Streamline your pharmaceutical distribution operations with comprehensive 
            modules for sales, inventory management, financial tracking, and AI-driven insights. 
            Built for Angola, India, UAE, and international expansion.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={handleLogin}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 text-lg"
              data-testid="button-get-started"
            >
              Get Started
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-3 text-lg"
              data-testid="button-learn-more"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Complete Pharmaceutical Management Solution
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage every aspect of your pharmaceutical distribution business with 
            role-based access, compliance tracking, and AI-powered automation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-shadow" data-testid="card-feature-sales">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Sales & CRM</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Manage customers, quotations, invoices, and track receivables with 
                built-in credit control and commission tracking.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow" data-testid="card-feature-inventory">
            <CardHeader>
              <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6 text-chart-2" />
              </div>
              <CardTitle>Inventory & Warehouse</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Multi-warehouse inventory with pharmaceutical batch tracking, 
                expiry alerts, and FEFO compliance for safety.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow" data-testid="card-feature-finance">
            <CardHeader>
              <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-chart-3" />
              </div>
              <CardTitle>Finance & Accounting</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Automated double-entry accounting with multi-country support, 
                P&L reports, and AI-powered bank reconciliation.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow" data-testid="card-feature-ai">
            <CardHeader>
              <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-chart-4" />
              </div>
              <CardTitle>AI-Powered Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Smart replenishment suggestions, competitor price tracking, 
                and predictive analytics for demand forecasting.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow" data-testid="card-feature-compliance">
            <CardHeader>
              <div className="w-12 h-12 bg-chart-5/10 rounded-lg flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-chart-5" />
              </div>
              <CardTitle>Pharmaceutical Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Built-in batch tracking, expiry management, and regulatory 
                compliance features specific to pharmaceutical distribution.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow" data-testid="card-feature-global">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Global Ready</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Multi-currency, multi-language support (English/Portuguese) 
                with expansion capabilities for international operations.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Why Choose PharmaDist ERP?
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center" data-testid="benefit-automation">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h4 className="text-lg font-semibold mb-2">AI-Driven Automation</h4>
              <p className="text-muted-foreground">
                Reduce manual work with intelligent automation for inventory, 
                pricing, and financial processes.
              </p>
            </div>

            <div className="text-center" data-testid="benefit-compliance">
              <div className="w-16 h-16 bg-chart-2/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-chart-2" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Pharmaceutical Compliance</h4>
              <p className="text-muted-foreground">
                Built-in batch tracking, expiry management, and regulatory 
                compliance for pharmaceutical safety.
              </p>
            </div>

            <div className="text-center" data-testid="benefit-scalable">
              <div className="w-16 h-16 bg-chart-3/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-chart-3" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Scalable & Global</h4>
              <p className="text-muted-foreground">
                Scale across multiple countries with multi-currency and 
                multi-language support built-in.
              </p>
            </div>

            <div className="text-center" data-testid="benefit-realtime">
              <div className="w-16 h-16 bg-chart-4/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-chart-4" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Real-time Insights</h4>
              <p className="text-muted-foreground">
                Make informed decisions with real-time dashboards, 
                analytics, and AI-powered recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="bg-primary/5 rounded-2xl p-12 text-center">
          <h3 className="text-3xl font-bold text-foreground mb-4">
            Ready to Transform Your Pharmaceutical Distribution?
          </h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join pharmaceutical distributors who are already using PharmaDist ERP 
            to streamline operations, ensure compliance, and drive growth.
          </p>
          <Button 
            size="lg"
            onClick={handleLogin}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 text-lg"
            data-testid="button-start-trial"
          >
            Start Your Journey
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background/80">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                <Pill className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">
                © 2024 PharmaDist ERP. All rights reserved.
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Pharmaceutical Distribution Management System
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
