"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useSearchParams, useRouter } from "next/navigation";
import { Flag, CheckCircle, XCircle, Clock, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Report {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reporter: { id: string; full_name: string; avatar_url: string | null };
  reported_user: { id: string; full_name: string; avatar_url: string | null };
}

const statusColors: Record<string, { badge: string; icon: typeof Flag }> = {
  pending: { badge: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
  resolved: { badge: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
  dismissed: { badge: "bg-slate-100 text-slate-600 border-slate-200", icon: XCircle },
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const statusFilter = searchParams.get("status") || "pending";

  const fetchReports = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("reports")
      .select(`
        id, reason, details, status, created_at,
        reporter:reporter_id(id, full_name, avatar_url),
        reported_user:reported_user_id(id, full_name, avatar_url)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;
    setReports((data as unknown as Report[]) || []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    void (async () => {
      await fetchReports();
    })();
  }, [fetchReports]);

  const handleAction = async (reportId: string, action: "resolved" | "dismissed") => {
    const { data: { user } } = await supabase.auth.getUser();
    
    await (supabase
      .from("reports") as any)
      .update({
        status: action,
        resolved_by: user?.id,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    fetchReports();
  };

  const setStatus = (status: string) => {
    const params = new URLSearchParams(searchParams);
    if (status === "all") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    router.push(`/admin/reports?${params.toString()}`);
  };

  return (
    <div id="admin-reports" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900">Reports</h2>
        
        <div className="flex gap-2">
          {["pending", "resolved", "dismissed", "all"].map((status) => (
            <Button
              key={status}
              id={`filter-${status}`}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatus(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-16 bg-slate-100 rounded" />
            </Card>
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card className="p-8 text-center">
          <Flag className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No {statusFilter} reports found.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const StatusIcon = statusColors[report.status]?.icon || Flag;
            return (
              <Card key={report.id} id={`report-${report.id}`} className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={statusColors[report.status]?.badge}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {report.status}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <p className="font-semibold text-slate-900 mb-1">{report.reason}</p>
                    {report.details && (
                      <p className="text-sm text-slate-600 mb-3">{report.details}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-500">Reported:</span>
                        <Link 
                          href={`/user/${report.reported_user.id}`}
                          className="font-semibold text-slate-700 hover:text-blue-600"
                        >
                          {report.reported_user.full_name}
                        </Link>
                      </div>
                      <div className="text-slate-400">by</div>
                      <Link 
                        href={`/user/${report.reporter.id}`}
                        className="font-medium text-slate-600 hover:text-blue-600"
                      >
                        {report.reporter.full_name}
                      </Link>
                    </div>
                  </div>

                  {report.status === "pending" && (
                    <div className="flex gap-2 shrink-0">
                      <Button
                        id={`resolve-${report.id}`}
                        size="sm"
                        onClick={() => handleAction(report.id, "resolved")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                      <Button
                        id={`dismiss-${report.id}`}
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(report.id, "dismissed")}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
