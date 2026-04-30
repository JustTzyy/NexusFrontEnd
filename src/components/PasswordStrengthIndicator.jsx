const RULES = [
    { label: "8+ characters", test: (p) => p.length >= 8 },
    { label: "Uppercase letter", test: (p) => /[A-Z]/.test(p) },
    { label: "Lowercase letter", test: (p) => /[a-z]/.test(p) },
    { label: "Number", test: (p) => /[0-9]/.test(p) },
    { label: "Special character (!@#$...)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const LEVELS = [
    { label: "Too short", bar: "bg-gray-300", text: "text-gray-400" },
    { label: "Weak", bar: "bg-red-500", text: "text-red-500" },
    { label: "Fair", bar: "bg-orange-500", text: "text-orange-500" },
    { label: "Good", bar: "bg-yellow-500", text: "text-yellow-600" },
    { label: "Strong", bar: "bg-green-500", text: "text-green-600" },
    { label: "Very strong", bar: "bg-emerald-600", text: "text-emerald-600" },
];

export default function PasswordStrengthIndicator({ password, showRules = false }) {
    if (!password) return null;

    const passed = RULES.filter((r) => r.test(password)).length;
    const score = password.length < 4 ? 0 : passed;
    const level = LEVELS[score];

    return (
        <div className="space-y-1.5 mt-1.5">
            <div className="flex gap-1">
                {RULES.map((_, i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                            i < score ? level.bar : "bg-gray-200"
                        }`}
                    />
                ))}
            </div>
            <p className={`text-[11px] font-medium ${level.text}`}>{level.label}</p>
            {showRules && (
                <ul className="space-y-0.5 mt-1">
                    {RULES.map((rule) => {
                        const ok = rule.test(password);
                        return (
                            <li key={rule.label} className={`text-[11px] flex items-center gap-1 ${ok ? "text-green-600" : "text-gray-400"}`}>
                                <span>{ok ? "✓" : "○"}</span>
                                {rule.label}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
