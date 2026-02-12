import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Mail, Lock, User, Building, UserPlus, Phone } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [isApplicant, setIsApplicant] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp, signIn: authSignIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (isApplicant) {
      try {
        await api.registerApplicant({ email, password, ...(fullName && { full_name: fullName }) });
        // Sign in the newly registered applicant
        const signInResult = await authSignIn(email, password);
        if (signInResult.error) {
          setError(signInResult.error.message || 'Registration failed');
          setLoading(false);
          return;
        }
        setSuccess(true);
      } catch (err) {
        setError((err as any)?.message || 'Registration failed');
        setLoading(false);
        return;
      }
    } else {
      // Partner registration
      const result = await signUp(email, password, fullName, companyName, contactPhone.trim() || undefined);
      const { error } = result as { error: Error | null };
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-lg rounded-lg sm:px-10 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
            <p className="text-gray-600 mb-6">Please check your email to verify your account.</p>
            <Link to="/login" className="text-orange-500 hover:text-orange-600 font-medium">Go to Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img src="/logo.png" alt="Hainan Builder" className="mx-auto h-16 w-auto" />
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">Create Account</h2>
        <p className="mt-2 text-center text-sm text-gray-600">Register as a Partner or an Individual Applicant</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center">
                <input type="radio" name="role" checked={!isApplicant} onChange={() => setIsApplicant(false)} className="mr-2" />
                Partner
              </label>
              <label className="inline-flex items-center">
                <input type="radio" name="role" checked={isApplicant} onChange={() => setIsApplicant(true)} className="mr-2" />
                Individual Applicant
              </label>
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <div className="mt-1 relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="pl-10 block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="John Doe" />
              </div>
            </div>

            {!isApplicant && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Company Name</label>
                <div className="mt-1 relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input type="text" required value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                    className="pl-10 block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="Your Company Ltd." />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="partner@company.com" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone (optional)</label>
              <div className="mt-1 relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                  className="pl-10 block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="+1 234 567 8900" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="password" required minLength={12} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="Min. 12 characters" />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg text-white bg-orange-500 hover:bg-orange-600 focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 font-medium disabled:opacity-50">
              <UserPlus className="h-5 w-5" />
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">Already have an account? <Link to="/login" className="font-medium text-orange-500 hover:text-orange-600">Sign in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
