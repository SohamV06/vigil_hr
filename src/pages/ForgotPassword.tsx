import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Loader2, AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { verifySecurityAnswer, resetPassword, updateAdminSecurity, getSecurityQuestion } from '@/services/adminAuthService';

const SECURITY_QUESTIONS = [
    "In which year did the company start?",
    "What was the name of your first pet?",
    "In what city were you born?",
    "What is your mother's maiden name?",
    "What was the name of your first school?",
    "What is your favorite book?"
];

export default function ForgotPassword() {
    const location = useLocation();
    const navigate = useNavigate();

    const [step, setStep] = useState(1); // 1: Identify, 2: New Password, 3: Set New Question, 4: Success
    const [email, setEmail] = useState(location.state?.email || '');
    const [currentQuestion, setCurrentQuestion] = useState(location.state?.initialQuestion || '');
    const [answer, setAnswer] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [shouldUpdateQuestion, setShouldUpdateQuestion] = useState('no');

    // For Step 3: New Security Question setup
    const [adminId, setAdminId] = useState('');
    const [newQuestion, setNewQuestion] = useState(SECURITY_QUESTIONS[0]);
    const [newAnswer, setNewAnswer] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Fetch question when email is entered (only if not already provided)
    useEffect(() => {
        const fetchQuestion = async () => {
            // Only fetch if we don't have a question or if the email changed from the initial one
            if (email.includes('@') && email.includes('.') && (!currentQuestion || email !== location.state?.email)) {
                try {
                    const response = await getSecurityQuestion(email);
                    if (response.success && response.question) {
                        setCurrentQuestion(response.question);
                        setError('');
                    } else {
                        setCurrentQuestion(response.message || 'No security question found.');
                    }
                } catch (err) {
                    setCurrentQuestion('Error loading question.');
                }
            } else if (!email) {
                setCurrentQuestion('');
            }
        };

        const timer = setTimeout(fetchQuestion, 500);
        return () => clearTimeout(timer);
    }, [email, currentQuestion, location.state?.email]);

    const handleVerifyIdentity = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await verifySecurityAnswer(email, answer);
            if (response.success) {
                setStep(2);
            } else {
                setError(response.message || 'Verification failed. Please check your email and answer.');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (!passwordRegex.test(newPassword)) {
            setError('Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await resetPassword(email, answer, newPassword);
            if (response.success) {
                if (shouldUpdateQuestion === 'yes') {
                    // Use the ID returned from the RPC reset call
                    const resetResponse = response as any;
                    const userId = resetResponse.user?.id;

                    if (userId) {
                        setAdminId(userId);
                        setStep(3);
                    } else {
                        // Fallback: try to see if we can move on or just finish
                        const { toast } = await import('sonner');
                        toast.success('Password reset! Please log in.');
                        navigate('/auth');
                    }
                } else {
                    const { toast } = await import('sonner');
                    toast.success('Your password has been updated successfully.');
                    navigate('/auth');
                }
            } else {
                setError(response.message || 'Failed to reset password.');
            }
        } catch (err) {
            console.error("Error during reset:", err);
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSecuritySetup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAnswer) {
            setError('Please provide an answer to your new security question.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await updateAdminSecurity(adminId, newQuestion, newAnswer);
            if (response.success) {
                setStep(4);
            } else {
                setError(response.message || 'Failed to update security question.');
            }
        } catch (err) {
            setError('An error occurred during security setup.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md animate-fade-in">
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/auth')}
                        className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Login
                    </button>
                </div>

                <Card className="shadow-card">
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl">
                            {step === 4 ? 'Success!' : 'Reset Password'}
                        </CardTitle>
                        <CardDescription>
                            {step === 1 && 'Enter your email and answer the security question'}
                            {step === 2 && 'Create a new secure password'}
                            {step === 3 && 'Choose and answer a new security question for future use'}
                            {step === 4 && 'Your password and security question have been updated'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {step === 1 && (
                            <form onSubmit={handleVerifyIdentity} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Admin Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="pratikshaangadi98@gmail.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-4 pt-2">
                                    <div className="space-y-2">
                                        <Label>Security Question</Label>
                                        <p className="text-sm font-medium p-3 bg-muted/50 rounded-lg border">
                                            {currentQuestion}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="answer">Your Answer</Label>
                                        <Input
                                            id="answer"
                                            placeholder="Enter answer"
                                            value={answer}
                                            onChange={(e) => setAnswer(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Next
                                </Button>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="newPassword"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            autoFocus
                                            required
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-3 pt-2">
                                    <Label>Do you want to change your security question?</Label>
                                    <RadioGroup
                                        value={shouldUpdateQuestion}
                                        onValueChange={setShouldUpdateQuestion}
                                        className="flex gap-4"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="yes" id="q-yes" />
                                            <Label htmlFor="q-yes" className="cursor-pointer">Yes</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="no" id="q-no" />
                                            <Label htmlFor="q-no" className="cursor-pointer">No</Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {shouldUpdateQuestion === 'yes' ? 'Next' : 'Complete Reset'}
                                </Button>
                            </form>
                        )}

                        {step === 3 && (
                            <form onSubmit={handleUpdateSecuritySetup} className="space-y-6">
                                <div className="space-y-3">
                                    <Label>Choose a New Question</Label>
                                    <RadioGroup value={newQuestion} onValueChange={setNewQuestion} className="space-y-2">
                                        {SECURITY_QUESTIONS.map((q, i) => (
                                            <div key={i} className="flex items-start space-x-3 p-2 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                                                <RadioGroupItem value={q} id={`q-${i}`} className="mt-1" />
                                                <Label htmlFor={`q-${i}`} className="text-sm font-normal cursor-pointer">
                                                    {q}
                                                </Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="newAnswer">Your Answer</Label>
                                    <Input
                                        id="newAnswer"
                                        placeholder="Enter your answer"
                                        value={newAnswer}
                                        onChange={(e) => setNewAnswer(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Complete Setup
                                </Button>
                            </form>
                        )}

                        {step === 4 && (
                            <div className="text-center space-y-6">
                                <div className="flex justify-center">
                                    <CheckCircle2 className="h-16 w-16 text-success animate-bounce-in" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold">Setup Complete</h3>
                                    <p className="text-muted-foreground">
                                        Now your password and security question has been updated.
                                    </p>
                                </div>
                                <Button onClick={() => navigate('/auth')} className="w-full">
                                    Back to Login
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div >
    );
}
