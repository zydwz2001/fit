import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { DESIGN } from '@/types';

export function BodyPasswordPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const { dispatch } = useApp();

  const addDigit = (digit: string) => {
    if (password.length >= 4 || error) return;

    const nextPassword = `${password}${digit}`;
    setPassword(nextPassword);

    if (nextPassword.length === 4) {
      if (nextPassword === DESIGN.BODY_PASSWORD) {
        dispatch({ type: 'SET_BODY_UNLOCKED', payload: true });
        return;
      }

      setError(true);
      window.setTimeout(() => {
        setPassword('');
        setError(false);
      }, 500);
    }
  };

  const deleteDigit = () => {
    setPassword(p => p.slice(0, -1));
  };

  return (
    <div className="scroll-content flex flex-col items-center px-5 pt-10">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-lock text-vibe-green text-xl"></i>
        </div>
        <h2 className="text-xl font-bold mb-2">输入密码</h2>
        <p className="text-sm text-slate-500">输入正确的 4 位密码后自动进入</p>
      </div>

      <div className="flex gap-3 mb-8">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${
              password.length > i
                ? 'border-vibe-green bg-vibe-green/5'
                : error
                ? 'border-red-400 bg-red-50'
                : 'border-slate-200'
            }`}
          >
            {password.length > i && <div className="w-3 h-3 bg-vibe-green rounded-full"></div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-x-6 gap-y-2 w-full max-w-xs">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map((key, i) => (
          <button
            key={i}
            disabled={error || key === ''}
            className="h-14 rounded-xl flex items-center justify-center text-xl font-bold active:bg-slate-100 disabled:opacity-50"
            onClick={() => {
              if (key === 'delete') deleteDigit();
              else if (key) addDigit(key);
            }}
          >
            {key === 'delete' ? <i className="fas fa-delete-left text-slate-400"></i> : key}
          </button>
        ))}
      </div>
      <p className={`mt-4 text-sm font-semibold ${error ? 'text-red-500' : 'text-transparent'}`}>
        密码错误，请重新输入
      </p>
    </div>
  );
}
