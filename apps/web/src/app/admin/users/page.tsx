"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Ban, CheckCircle, User, Calendar, Flag } from "lucide-react";
import { formatDistanceToNow, format, addDays } from "date-fns";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserProfile {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  banned_until: string | null;
  role: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [banDialog, setBanDialog] = useState<{ userId: string; name: string } | null>(null);
  const [banDuration, setBanDuration] = useState("7");
  const searchParams = useSearchParams();
  const router = useRouter();
  const filter = searchParams.get("filter");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    
    let query = supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, created_at, banned_until, role")
      .order("created_at", { ascending: false })
      .limit(50);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (filter === "banned") {
      query = query.gt("banned_until", new Date().toISOString());
    }

    const { data } = await query;
    setUsers((data as UserProfile[]) || []);
    setLoading(false);
  }, [search, filter]);

  useEffect(() => {
    const debounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(debounce);
  }, [fetchUsers]);

  const handleBan = async () => {
    if (!banDialog) return;
    
    const bannedUntil = addDays(new Date(), parseInt(banDuration));
    await (supabase
      .from("profiles") as any)
      .update({ banned_until: bannedUntil.toISOString() })
      .eq("id", banDialog.userId);

    setBanDialog(null);
    fetchUsers();
  };

  const handleUnban = async (userId: string) => {
    await (supabase
      .from("profiles") as any)
      .update({ banned_until: null })
      .eq("id", userId);
    fetchUsers();
  };

  const setFilter = (newFilter: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (newFilter) {
      params.set("filter", newFilter);
    } else {
      params.delete("filter");
    }
    router.push(`/admin/users?${params.toString()}`);
  };

  const isBanned = (user: UserProfile) => 
    user.banned_until && new Date(user.banned_until) > new Date();

  return (
    <div id="admin-users" className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900">Users</h2>
        
        <div className="flex gap-2">
          <Button
            id="filter-all-users"
            variant={!filter ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(null)}
          >
            All
          </Button>
          <Button
            id="filter-banned"
            variant={filter === "banned" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("banned")}
          >
            Banned
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          id="user-search"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-16 bg-slate-100 rounded" />
            </Card>
          ))}
        </div>
      ) : users.length === 0 ? (
        <Card className="p-8 text-center">
          <User className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No users found.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.id} id={`user-${user.id}`} className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>{user.full_name?.[0] || "?"}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link 
                      href={`/user/${user.id}`}
                      className="font-semibold text-slate-900 hover:text-blue-600"
                    >
                      {user.full_name || "No name"}
                    </Link>
                    {user.role === "admin" && (
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200">Admin</Badge>
                    )}
                    {isBanned(user) && (
                      <Badge className="bg-red-100 text-red-700 border-red-200">
                        <Ban className="h-3 w-3 mr-1" />
                        Banned
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{user.email}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                    </span>
                    {isBanned(user) && (
                      <span className="text-red-500">
                        Ban expires: {format(new Date(user.banned_until!), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <Button
                    id={`view-reports-${user.id}`}
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <Link href={`/admin/reports?reported=${user.id}`}>
                      <Flag className="h-4 w-4 mr-1" />
                      Reports
                    </Link>
                  </Button>
                  
                  {isBanned(user) ? (
                    <Button
                      id={`unban-${user.id}`}
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnban(user.id)}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Unban
                    </Button>
                  ) : (
                    <Button
                      id={`ban-${user.id}`}
                      size="sm"
                      variant="outline"
                      onClick={() => setBanDialog({ userId: user.id, name: user.full_name })}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      disabled={user.role === "admin"}
                    >
                      <Ban className="h-4 w-4 mr-1" />
                      Ban
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Ban Dialog */}
      <Dialog open={!!banDialog} onOpenChange={() => setBanDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Set a ban duration for <strong>{banDialog?.name}</strong>. They will not be able to create listings or bids during this time.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              {["1", "7", "30", "365"].map((days) => (
                <Button
                  key={days}
                  variant={banDuration === days ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBanDuration(days)}
                >
                  {days === "1" ? "1 day" : days === "365" ? "1 year" : `${days} days`}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialog(null)}>Cancel</Button>
            <Button onClick={handleBan} className="bg-red-600 hover:bg-red-700">
              <Ban className="h-4 w-4 mr-2" />
              Ban for {banDuration} day{banDuration !== "1" ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
