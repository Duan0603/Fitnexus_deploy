import React from 'react';

export default function PasswordStrengthIndicator({ password }) {
    const conditions = [
        {
            id: "uppercase",
            text: "1 chữ cái hoa (A–Z)",
            met: /[A-Z]/.test(password),
        },
        {
            id: 'number-special',
            text: '1 chữ số hoặc ký tự đặc biệt (ví dụ: #?! &)',
            met: /[0-9#?!@$%^&*()_+\-=\[\]{};':"\\|,.<>\/]/.test(password)
        },
        {
            id: 'length',
            text: '10 ký tự',
            met: password.length >= 10
        }
    ];

    const allConditionsMet = conditions.every(condition => condition.met);

    return (
        <div className="mt-2 space-y-2">
            <p className="text-sm text-gray-600">
                Mật khẩu của bạn phải có ít nhất:
            </p>
            <div className="space-y-1">
                {conditions.map((condition) => (
                    <div key={condition.id} className="flex items-center space-x-2">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${condition.met
                                ? 'border-green-500 bg-green-500'
                                : 'border-gray-300'
                            }`}>
                            {condition.met && (
                                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <span className={`text-sm ${condition.met ? 'text-green-600' : 'text-gray-600'
                            }`}>
                            {condition.text}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
