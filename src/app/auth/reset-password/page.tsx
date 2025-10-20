'use client';
import { useAppDispatch } from '@/app/hook';
import { setLoading } from '@/app/store/ui';
import { Button } from '@/components/Button';
import { resetPasswordRequest } from '@/utils/api';
import { forwardArrow } from '@/utils/icon';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

const ResetPassword = () => {
  const ResetPasswordContent = () => {
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();
    const status = searchParams.get('status');
    const [email, setEmail] = useState('');
    const [resetPassword, setResetPassword] = useState(false);
    const router = useRouter();

    const resetPasswordHandler = async () => {
      if (email) {
        dispatch(setLoading(true));
        const response = await resetPasswordRequest(email);
        if (response.status === 200) {
          setResetPassword(true);
        }
        dispatch(setLoading(false));
      }
    };

    const [second, setSecond] = useState(10);
    useEffect(() => {
      if (status === 'success') {
        const interval = setInterval(() => {
          setSecond((prevSecond) => prevSecond - 1);
        }, 1000);
        if (second === 0) {
          router.push('/auth/login');
        }
        return () => clearInterval(interval);
      }
    }, [second, router, status]);

    return (
      <div className="flex flex-col items-center gap-6">
        <div className="mx-auto max-w-xs flex flex-col gap-3">
          <Image width={54} height={36} src="../assets/logo.svg" alt="logo" />
          {!resetPassword && (
            <h1 className="text-2xl xl:text-3xl font-semibold">
              {status === 'success'
                ? 'Password changed successully'
                : 'Reset Password'}
            </h1>
          )}
          {!resetPassword && !status && (
            <p className="text-sm font-sans font-normal text-[#64748B]">
              We will send you a link to reset your password.
            </p>
          )}
          {resetPassword && (
            <p className="text-sm font-sans font-normal text-[#64748B]">
              If this email is registered, a password reset link has been sent
              to <span className="text-[#1E40AF] underline">{email}</span>.
              Please check your inbox.
            </p>
          )}
          {status === 'success' && (
            <p className="text-sm font-sans font-normal text-[#64748B]">
              The system is processing and will return to the Login page. Please
              wait a few moments.
            </p>
          )}
        </div>

        {!resetPassword && !status && (
          <div className="w-full">
            <label className="text-[#0A0A0A] text-sm font-medium font-sans">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg font-medium bg-white border border-gray-200 placeholder-gray-500 text-sm focus:border-2 focus:outline-none focus:border-[#EAB308]"
              type="email"
              placeholder="name@email.com"
            />
          </div>
        )}
        {!resetPassword && !status && (
          <Button onClickFunc={resetPasswordHandler} className="w-full">
            Send
          </Button>
        )}
        <div className="w-full mx-auto max-w-xs border-b border-[#E2E8F0] text-center"></div>
        <div>
          <p className="flex items-center justify-center text-xs text-gray-600 text-center">
            New to APM? &nbsp;
            <Link
              href="/auth/login"
              className="text-[#1E40AF] text-sm font-medium flex justify-center items-center gap-2"
            >
              Back to log in
              {forwardArrow}
            </Link>
          </p>
        </div>
      </div>
    );
  };

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ResetPasswordContent />
    </Suspense>
  );
};

export default ResetPassword;
