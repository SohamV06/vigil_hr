import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Mail, Key, UserPlus, Loader2, CheckCircle2 } from 'lucide-react';

const SECURITY_QUESTIONS = [
  "In which year did the company start?",
  "What was the name of your first pet?",
  "In what city were you born?",
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What is your favorite book?"
];

export default function Settings() {
  const { user } = useAuth();
  const canManageUsers = user?.permissions?.includes('settings') ?? true;

  return (
    <DashboardLayout title="Settings" subtitle="Manage your account settings">
      <div className="max-w-2xl space-y-6 animate-fade-in">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your account details and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email Address</p>
                <p className="font-medium text-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Key className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account ID</p>
                <p className="font-medium text-foreground font-mono text-sm">{user?.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <AccountSecurityForm userId={user?.id || ''} userEmail={user?.email || ''} />

        {canManageUsers && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Manage Users
              </CardTitle>
              <CardDescription>
                Add new admin users to the portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AddAdminForm currentUserEmail={user?.email || ''} />
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-lg font-medium mb-4">Existing Users</h3>
                <AdminUsersList currentUserEmail={user?.email || ''} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ... (existing About card) ... */}

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>About Vigil Safety Technologies</CardTitle>
            <CardDescription>
              Internal hiring platform management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Vigil Safety Technologies is your centralized platform for managing job postings and reviewing
              candidate applications. Use the dashboard to monitor hiring activity, create and
              manage job listings, and track applicant progress through the hiring pipeline.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function AccountSecurityForm({ userId, userEmail }: { userId: string; userEmail: string }) {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState('');

  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [securityStatus, setSecurityStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [securityMessage, setSecurityMessage] = useState('');

  useEffect(() => {
    if (!userEmail) return;
    const loadCurrentQuestion = async () => {
      const { getSecurityQuestion } = await import('@/services/adminAuthService');
      const response = await getSecurityQuestion(userEmail);
      if (response.success && response.question) {
        setSecurityQuestion(response.question);
      }
    };
    void loadCurrentQuestion();
  }, [userEmail]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus('loading');
    setPasswordMessage('');

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(passwordForm.newPassword)) {
      setPasswordStatus('error');
      setPasswordMessage('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus('error');
      setPasswordMessage('New password and confirm password do not match.');
      return;
    }

    try {
      const { changeAdminPassword } = await import('@/services/adminAuthService');
      const response = await changeAdminPassword(userEmail, passwordForm.currentPassword, passwordForm.newPassword);

      if (response.success) {
        setPasswordStatus('success');
        setPasswordMessage(response.message);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordStatus('error');
        setPasswordMessage(response.message);
      }
    } catch {
      setPasswordStatus('error');
      setPasswordMessage('Failed to update password. Please try again.');
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityStatus('loading');
    setSecurityMessage('');

    if (!securityAnswer.trim()) {
      setSecurityStatus('error');
      setSecurityMessage('Security answer is required.');
      return;
    }

    try {
      const { updateAdminSecurity } = await import('@/services/adminAuthService');
      const response = await updateAdminSecurity(userId, securityQuestion, securityAnswer.trim());

      if (response.success) {
        setSecurityStatus('success');
        setSecurityMessage(response.message);
        setSecurityAnswer('');
      } else {
        setSecurityStatus('error');
        setSecurityMessage(response.message);
      }
    } catch {
      setSecurityStatus('error');
      setSecurityMessage('Failed to update security question. Please try again.');
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Account Security
        </CardTitle>
        <CardDescription>
          Update your password and security question after login
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <h3 className="font-medium">Change Password</h3>
          {passwordStatus === 'error' && (
            <Alert variant="destructive">
              <AlertDescription>{passwordMessage}</AlertDescription>
            </Alert>
          )}
          {passwordStatus === 'success' && (
            <Alert>
              <AlertDescription>{passwordMessage}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              required
            />
          </div>
          <Button type="submit" disabled={passwordStatus === 'loading'}>
            {passwordStatus === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Update Password
          </Button>
        </form>

        <form onSubmit={handleSecuritySubmit} className="space-y-4 border-t pt-6">
          <h3 className="font-medium">Change Security Question</h3>
          {securityStatus === 'error' && (
            <Alert variant="destructive">
              <AlertDescription>{securityMessage}</AlertDescription>
            </Alert>
          )}
          {securityStatus === 'success' && (
            <Alert>
              <AlertDescription>{securityMessage}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-3">
            <Label>Select Security Question</Label>
            <RadioGroup value={securityQuestion} onValueChange={setSecurityQuestion} className="space-y-2">
              {SECURITY_QUESTIONS.map((q, i) => (
                <div key={i} className="flex items-start space-x-3 p-2 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value={q} id={`question-${i}`} className="mt-1" />
                  <Label htmlFor={`question-${i}`} className="text-sm font-normal cursor-pointer">
                    {q}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="securityAnswer">Your Answer</Label>
            <Input
              id="securityAnswer"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              placeholder="Enter your answer"
              required
            />
          </div>
          <Button type="submit" disabled={securityStatus === 'loading'}>
            {securityStatus === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Update Security Question
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AddAdminForm({ currentUserEmail }: { currentUserEmail: string }) {
  const [formData, setFormData] = useState({
    newEmail: '',
    newPassword: '',
    confirmNewPassword: '',
    currentPassword: ''
  });

  const [permissions, setPermissions] = useState({
    dashboard: true,
    jobs: true,
    applications: true,
    settings: true
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handlePermissionChange = (key: string) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key as keyof typeof permissions] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    if (formData.newPassword !== formData.confirmNewPassword) {
      setStatus('error');
      setMessage('New passwords do not match.');
      return;
    }

    try {
      const { createAdmin } = await import('@/services/adminAuthService');

      const selectedPermissions = Object.entries(permissions)
        .filter(([_, value]) => value)
        .map(([key]) => key);

      const response = await createAdmin(
        currentUserEmail,
        formData.currentPassword,
        formData.newEmail,
        formData.newPassword,
        selectedPermissions
      );

      if (response.success) {
        setStatus('success');
        setMessage(response.message);
        setFormData({
          newEmail: '',
          newPassword: '',
          confirmNewPassword: '',
          currentPassword: ''
        });
        setPermissions({
          dashboard: true,
          jobs: true,
          applications: true,
          settings: true
        });
      } else {
        setStatus('error');
        setMessage(response.message);
      }
    } catch (err) {
      setStatus('error');
      setMessage('Failed to create new admin user.');
    }
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-6 space-y-4 animate-fade-in">
        <CheckCircle2 className="h-12 w-12 text-success" />
        <p className="text-center font-medium">{message}</p>
        <Button variant="outline" onClick={() => setStatus('idle')}>Add Another User</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status === 'error' && (
        <Alert variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="newEmail">New User Email</Label>
          <Input
            id="newEmail"
            type="email"
            placeholder="colleague@example.com"
            value={formData.newEmail}
            onChange={handleChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="newPassword">New User Password</Label>
          <Input
            id="newPassword"
            type="password"
            placeholder="••••••••"
            value={formData.newPassword}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
        <Input
          id="confirmNewPassword"
          type="password"
          placeholder="••••••••"
          value={formData.confirmNewPassword}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-3 pt-2">
        <Label>Access Permissions</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg bg-card/50">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="perm-dashboard"
              checked={permissions.dashboard}
              onChange={() => handlePermissionChange('dashboard')}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
            />
            <Label htmlFor="perm-dashboard" className="font-normal cursor-pointer select-none">Dashboard</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="perm-jobs"
              checked={permissions.jobs}
              onChange={() => handlePermissionChange('jobs')}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
            />
            <Label htmlFor="perm-jobs" className="font-normal cursor-pointer select-none">Jobs Management</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="perm-applications"
              checked={permissions.applications}
              onChange={() => handlePermissionChange('applications')}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
            />
            <Label htmlFor="perm-applications" className="font-normal cursor-pointer select-none">Applications</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="perm-settings"
              checked={permissions.settings}
              onChange={() => handlePermissionChange('settings')}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
            />
            <Label htmlFor="perm-settings" className="font-normal cursor-pointer select-none">Settings</Label>
          </div>

        </div>
        <p className="text-xs text-muted-foreground">Select the modules this user can access.</p>
      </div>

      <div className="pt-4 border-t">
        <div className="space-y-2">
          <Label htmlFor="currentPassword" className="text-destructive font-semibold">
            Verify Your Password
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            Enter your current admin password to authorize this action.
          </p>
          <Input
            id="currentPassword"
            type="password"
            placeholder="Your Admin Password"
            value={formData.currentPassword}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={status === 'loading'}>
        {status === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create User'}
      </Button>
    </form>
  );
}

import { Trash2 } from 'lucide-react';

function AdminUsersList({ currentUserEmail }: { currentUserEmail: string }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const { getAdminUsers } = await import('@/services/adminAuthService');
      const response = await getAdminUsers(currentUserEmail);
      if (response.success && response.users) {

        // Sort users: 
        // 1. Super Admin (pratikshaangadi98@gmail.com) always on top
        // 2. Current User (if different from super admin) next
        // 3. Then by date descending (or SQL order)
        const sortedUsers = response.users.sort((a: any, b: any) => {
          const superAdminEmail = 'pratikshaangadi98@gmail.com';

          const isASuper = a.email.toLowerCase() === superAdminEmail.toLowerCase();
          const isBSuper = b.email.toLowerCase() === superAdminEmail.toLowerCase();

          if (isASuper) return -1;
          if (isBSuper) return 1;

          const isACurrent = a.email.toLowerCase() === currentUserEmail.toLowerCase();
          const isBCurrent = b.email.toLowerCase() === currentUserEmail.toLowerCase();

          if (isACurrent) return -1;
          if (isBCurrent) return 1;

          return 0;
        });
        setUsers(sortedUsers);
      } else {
        setError(response.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (targetEmail: string, userId: string) => {
    if (!window.confirm(`Are you sure you want to delete user ${targetEmail}? This action cannot be undone.`)) {
      return;
    }

    setDeleteLoading(userId);
    try {
      const { deleteAdminUser } = await import('@/services/adminAuthService');
      const response = await deleteAdminUser(currentUserEmail, targetEmail);

      if (response.success) {
        // Refresh list
        fetchUsers();
      } else {
        alert(response.message || 'Failed to delete user');
      }
    } catch (err) {
      alert('An error occurred while deleting');
    } finally {
      setDeleteLoading(null);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUserEmail]);

  if (loading) return <div className="text-sm text-muted-foreground p-4 text-center"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Loading users...</div>;
  if (error) return <div className="text-sm text-destructive p-4">{error}</div>;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-muted/30 rounded-lg border">
        <div className="p-3 border-b text-xs font-semibold text-muted-foreground grid grid-cols-12 gap-2">
          <div className="col-span-5">Email</div>
          <div className="col-span-4">Permissions</div>
          <div className="col-span-3 text-right">Action</div>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {users.map((u: any) => {
            const superAdminEmail = 'pratikshaangadi98@gmail.com';
            const isSuperAdminRow = u.email.toLowerCase() === superAdminEmail.toLowerCase();
            const isCurrentUserRow = u.email.toLowerCase() === currentUserEmail.toLowerCase();
            const isViewerSuperAdmin = currentUserEmail.toLowerCase() === superAdminEmail.toLowerCase();

            // Delete Permission Logic:
            // 1. The 'Main' Super Admin row can NEVER be deleted by anyone.
            // 2. The Viewer can delete if:
            //    a. They are the Super Admin (can delete anyone else).
            //    b. They are deleting themselves (Self-delete).
            //    c. Regular admins cannot delete other admins.
            const canDelete = !isSuperAdminRow && (isViewerSuperAdmin || isCurrentUserRow);

            return (
              <div key={u.id} className={`p-3 border-b last:border-0 text-sm grid grid-cols-12 gap-2 items-center transition-colors ${isCurrentUserRow || isSuperAdminRow ? 'bg-primary/5' : 'hover:bg-muted/50'}`}>
                <div className="col-span-5 font-medium truncate" title={u.email}>
                  {u.email}
                  {isSuperAdminRow && <span className="ml-2 text-[10px] bg-purple-500/10 text-purple-600 px-1.5 py-0.5 rounded-full border border-purple-200">Main</span>}
                  {!isSuperAdminRow && isCurrentUserRow && <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">You</span>}
                </div>
                <div className="col-span-4 text-xs text-muted-foreground">
                  {u.permissions ? u.permissions.length : 'All'} modules
                </div>
                <div className="col-span-3 text-right flex justify-end">
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={deleteLoading === u.id}
                      onClick={() => handleDelete(u.email, u.id)}
                      title="Delete User"
                    >
                      {deleteLoading === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
          {users.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">No users found</div>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-right">
        Total Users: {users.length}
      </p>
    </div>
  );
}
