import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react";
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
  ai_suggested_response: string;
  created_at: string;
  student_id: string;
}

interface Profile {
  name: string;
  email: string;
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

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    loadComplaints();
    
    const channel = supabase
      .channel('admin_complaints_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'complaints'
        },
        () => loadComplaints()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadComplaints = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load complaints",
        variant: "destructive",
      });
    } else {
      setComplaints(data || []);
      
      // Load student profiles
      const studentIds = [...new Set(data?.map((c) => c.student_id) || [])];
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", studentIds);

      const profileMap: Record<string, Profile> = {};
      profileData?.forEach((p) => {
        profileMap[p.id] = { name: p.name, email: p.email };
      });
      setProfiles(profileMap);
    }
    setLoading(false);
  };

  const updateComplaint = async (
    id: string,
    status: "Pending" | "In Progress" | "Resolved" | "Withdrawn",
    response: string
  ) => {
    const { error } = await supabase
      .from("complaints")
      .update({ status, admin_response: response })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update complaint",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Complaint updated successfully",
      });
      loadComplaints();
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (filter === "all") return true;
    return c.status === filter;
  });

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "Pending").length,
    inProgress: complaints.filter((c) => c.status === "In Progress").length,
    resolved: complaints.filter((c) => c.status === "Resolved").length,
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="bg-card border-b shadow-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">Complaint Management System</p>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <AlertCircle className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolved}</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">All Complaints</h2>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading complaints...</p>
        ) : (
          <div className="grid gap-4">
            {filteredComplaints.map((complaint) => (
              <ComplaintCard
                key={complaint.id}
                complaint={complaint}
                profile={profiles[complaint.student_id]}
                onUpdate={updateComplaint}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ComplaintCard({
  complaint,
  profile,
  onUpdate,
}: {
  complaint: Complaint;
  profile?: Profile;
  onUpdate: (id: string, status: string, response: string) => void;
}) {
  const [status, setStatus] = useState(complaint.status);
  const [response, setResponse] = useState(complaint.admin_response || "");
  const [showAISuggestion, setShowAISuggestion] = useState(false);

  const handleSave = () => {
    onUpdate(complaint.id, status, response);
  };

  const useAISuggestion = () => {
    setResponse(complaint.ai_suggested_response || "");
    setShowAISuggestion(false);
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">{complaint.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{complaint.description}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{complaint.complaint_id}</Badge>
            <Badge className={statusColors[complaint.status as keyof typeof statusColors]}>
              {complaint.status}
            </Badge>
            <Badge className={priorityColors[complaint.priority as keyof typeof priorityColors]}>
              {complaint.priority} Priority
            </Badge>
            {complaint.category && <Badge variant="secondary">{complaint.category}</Badge>}
            {complaint.ai_suggested_category && complaint.ai_suggested_category !== complaint.category && (
              <Badge variant="outline" className="border-primary">
                AI: {complaint.ai_suggested_category}
              </Badge>
            )}
          </div>
          
          {profile && (
            <p className="text-sm text-muted-foreground">
              Submitted by: {profile.name} ({profile.email})
            </p>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Admin Response</label>
            {complaint.ai_suggested_response && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAISuggestion(!showAISuggestion)}
              >
                {showAISuggestion ? "Hide" : "View"} AI Suggestion
              </Button>
            )}
          </div>
          
          {showAISuggestion && (
            <div className="bg-accent rounded-lg p-3 mb-2">
              <p className="text-sm mb-2">{complaint.ai_suggested_response}</p>
              <Button size="sm" onClick={useAISuggestion}>
                Use This Response
              </Button>
            </div>
          )}
          
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Enter your response to the student..."
            rows={4}
          />
        </div>

        <Button onClick={handleSave} className="w-full">
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
}