import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, LogOut, FileText } from "lucide-react";
import { ComplaintForm } from "@/components/ComplaintForm";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Complaint {
  id: string;
  complaint_id: string;
  title: string;
  description: string;
  category: string;
  ai_suggested_category: string;
  priority: string;
  status: string;
  admin_response: string;
  created_at: string;
  updated_at: string;
}

const statusColors = {
  Pending: "bg-warning",
  "In Progress": "bg-primary",
  Resolved: "bg-success",
  Withdrawn: "bg-muted",
};

const priorityColors = {
  Low: "bg-muted",
  Medium: "bg-warning",
  High: "bg-destructive",
};

export default function StudentDashboard() {
  const { user, signOut } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadComplaints();
      
      const channel = supabase
        .channel('complaints_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'complaints',
            filter: `student_id=eq.${user.id}`
          },
          () => loadComplaints()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadComplaints = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("student_id", user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load complaints",
        variant: "destructive",
      });
    } else {
      setComplaints(data || []);
    }
    setLoading(false);
  };

  const handleComplaintSubmit = () => {
    setDialogOpen(false);
    loadComplaints();
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="bg-card border-b shadow-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Student Portal
            </h1>
            <p className="text-sm text-muted-foreground">Welcome back, {user?.email}</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">My Complaints</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-elevated">
                <Plus className="mr-2 h-4 w-4" />
                New Complaint
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <ComplaintForm onSuccess={handleComplaintSubmit} />
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading complaints...</p>
        ) : complaints.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-medium text-muted-foreground mb-2">
                No complaints yet
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Submit your first complaint to get started
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Complaint
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {complaints.map((complaint) => (
              <Card key={complaint.id} className="shadow-card hover:shadow-elevated transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{complaint.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mb-3">{complaint.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{complaint.complaint_id}</Badge>
                        <Badge className={statusColors[complaint.status as keyof typeof statusColors]}>
                          {complaint.status}
                        </Badge>
                        <Badge className={priorityColors[complaint.priority as keyof typeof priorityColors]}>
                          {complaint.priority} Priority
                        </Badge>
                        {complaint.category && (
                          <Badge variant="secondary">{complaint.category}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                {complaint.admin_response && (
                  <CardContent>
                    <div className="bg-accent rounded-lg p-4">
                      <p className="text-sm font-medium text-accent-foreground mb-1">
                        Admin Response:
                      </p>
                      <p className="text-sm text-muted-foreground">{complaint.admin_response}</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}