import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, Sparkles, TrendingUp } from "lucide-react";

export default function Index() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/student");
      }
    }
  }, [user, loading, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="bg-card/80 backdrop-blur-sm border-b shadow-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Brototype Portal
          </h1>
          <Button onClick={() => navigate("/auth")}>
            Get Started
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <section className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Student Complaint Management
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Streamline communication between students and staff with AI-powered complaint tracking and resolution
          </p>
          <Button size="lg" className="shadow-elevated" onClick={() => navigate("/auth")}>
            Access Portal
          </Button>
        </section>

        <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="shadow-card hover:shadow-elevated transition-shadow">
            <CardHeader>
              <FileText className="h-10 w-10 mb-4 text-primary" />
              <CardTitle>Easy Submission</CardTitle>
              <CardDescription>
                Submit complaints quickly with our intuitive form interface
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-card hover:shadow-elevated transition-shadow">
            <CardHeader>
              <Sparkles className="h-10 w-10 mb-4 text-primary" />
              <CardTitle>AI-Powered</CardTitle>
              <CardDescription>
                Automatic categorization and priority detection using advanced AI
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-card hover:shadow-elevated transition-shadow">
            <CardHeader>
              <TrendingUp className="h-10 w-10 mb-4 text-primary" />
              <CardTitle>Real-Time Tracking</CardTitle>
              <CardDescription>
                Monitor complaint status and receive updates instantly
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-card hover:shadow-elevated transition-shadow">
            <CardHeader>
              <Shield className="h-10 w-10 mb-4 text-primary" />
              <CardTitle>Secure & Private</CardTitle>
              <CardDescription>
                Your data is protected with enterprise-grade security
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        <section className="bg-card rounded-2xl p-8 md:p-12 shadow-elevated">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-3xl font-bold mb-4">How It Works</h3>
            <div className="grid md:grid-cols-3 gap-8 mt-8">
              <div>
                <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  1
                </div>
                <h4 className="font-semibold mb-2">Submit Complaint</h4>
                <p className="text-sm text-muted-foreground">
                  Fill out a simple form with your concern
                </p>
              </div>
              <div>
                <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  2
                </div>
                <h4 className="font-semibold mb-2">AI Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  System categorizes and prioritizes automatically
                </p>
              </div>
              <div>
                <div className="bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  3
                </div>
                <h4 className="font-semibold mb-2">Get Resolution</h4>
                <p className="text-sm text-muted-foreground">
                  Admins respond and resolve your complaint
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-card border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 Brototype. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}