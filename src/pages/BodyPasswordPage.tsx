import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components';
import { DESIGN } from '@/types';

export function BodyPasswordPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const { dispatch } = useApp();

  const handleSubmit = () => {
    if (password === DESIGN.BODY_PASSWORD) {
      dispatch({ type: 'SET_BODY_UNLOCKED', payload: true });
    } else {
      setError(true);
      setPassword('');
      setTimeout(() => setError(false), 1000);
    }
  };

  const addDigit = (digit: string) => {
    if (password.length < 4) {
      setPassword(p => p + digit);
    }
  };

  const deleteDigit = () => {
    setPassword(p => p.slice(0, -1));
  };

  return (
    <div className="scroll-content flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12">
        <div className="w-20 h-20 bg-vibe-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-lock text-vibe-green text-2xl"></i>
        </div>
        <h2 className="text-xl font-black mb-2">输入密码</h2>
        <p className="text-sm text-slate-400">访问身体数据需要验证</p>
      </div>

      <div className="flex gap-4 mb-12">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${
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

      <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'].map((key, i) => (
          <button
            key={i}
            className="h-16 rounded-2xl flex items-center justify-center text-xl font-bold"
            onClick={() => {
              if (key === 'delete') deleteDigit();
              else if (key) addDigit(key);
            }}
          >
            {key === 'delete' ? <i className="fas fa-delete-left text-slate-400"></i> : key}
          </button>
        ))}
      </div>

      {password.length === 4 && (
        <div className="mt-8 w-full max-w-xs">
          <Button onClick={handleSubmit} className="w-full">
            确认
          </Button>
        </div>
      )}
    </div>
  );
}
