import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Check, X } from "lucide-react";

const CONFIG_LABELS: Record<string, string> = {
  ai_model_professional: "Professional tier AI model",
  ai_model_cfo_suite: "CFO Suite AI model",
};

interface ConfigRow {
  id: number;
  key: string;
  value: string;
  updatedAt: string;
}

export default function Admin() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState<any>(null);
  const [configRows, setConfigRows] = useState<ConfigRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const adminPassword = password;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const [segRes, configRes] = await Promise.all([
        fetch("/api/admin/segments", { method: "GET", headers: { "x-admin-password": password }, credentials: "include" }),
        fetch("/api/admin/config", { method: "GET", headers: { "x-admin-password": password }, credentials: "include" }),
      ]);
      if (!segRes.ok) {
        setError("Invalid password");
        return;
      }
      const segJson = await segRes.json();
      const configJson = configRes.ok ? await configRes.json() : [];
      setData(segJson);
      setConfigRows(configJson);
      setIsAuthenticated(true);
    } catch {
      setError("Invalid password");
    }
  };

  const handleEditStart = (row: ConfigRow) => {
    setEditingKey(row.key);
    setEditValue(row.value);
  };

  const handleEditSave = async (key: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/config/${key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword },
        credentials: "include",
        body: JSON.stringify({ value: editValue }),
      });
      if (!res.ok) throw new Error("Failed");
      const updated: ConfigRow = await res.json();
      setConfigRows((rows) => rows.map((r) => (r.key === key ? updated : r)));
      setEditingKey(null);
    } catch {
      alert("Failed to save config");
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-synergise-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Admin Access</CardTitle>
            <CardDescription>Enter admin password to view segments</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full bg-synergise-primary">Authenticate</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-synergise-background p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-synergise-text">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-synergise-text-muted font-medium">Total Signups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totals.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-synergise-text-muted font-medium">Top Industry</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold truncate">
                {Object.entries(data.totals.byIndustry || {}).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || "N/A"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-synergise-text-muted font-medium">Top Region</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold truncate">
                {Object.entries(data.totals.byRegion || {}).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || "N/A"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-synergise-text-muted font-medium">Pro Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.totals.byTier?.professional || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Tier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.segments.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell>{new Date(user.signupDate).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.industry}</TableCell>
                    <TableCell>{user.region}</TableCell>
                    <TableCell>{user.revenueStage}</TableCell>
                    <TableCell>{user.subscriptionTier}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* AI Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>AI Configuration</CardTitle>
            <CardDescription>
              Control which Anthropic model is used per subscription tier. Click a value to edit inline.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Setting</TableHead>
                  <TableHead>Current Value</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configRows.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell className="font-medium">
                      {CONFIG_LABELS[row.key] ?? row.key}
                    </TableCell>
                    <TableCell>
                      {editingKey === row.key ? (
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="max-w-xs focus-visible:ring-synergise-primary"
                          autoFocus
                        />
                      ) : (
                        <code className="rounded bg-synergise-accent px-2 py-1 text-sm font-mono text-synergise-primary">
                          {row.value}
                        </code>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {editingKey === row.key ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleEditSave(row.key)}
                            disabled={saving}
                            className="bg-synergise-primary hover:bg-synergise-primary-dark h-8"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingKey(null)}
                            className="h-8"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditStart(row)}
                          className="h-8"
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs text-synergise-text-muted">
              Valid Anthropic models: <code>claude-haiku-4-5</code>, <code>claude-opus-4-5</code>, <code>claude-sonnet-4-5</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
