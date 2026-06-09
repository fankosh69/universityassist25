import { useEffect } from "react";

const SCRIPT_SRC = "https://www-cdn.icef.com/scripts/iasbadgeid.js";

interface IasBadgeProps {
  accountId?: string;
  floating?: boolean;
}

export const IasBadge = ({ accountId = "7243", floating = false }: IasBadgeProps) => {
  useEffect(() => {
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.crossOrigin = "anonymous";
    document.body.appendChild(s);
  }, []);

  if (floating) {
    return (
      <div
        className="fixed bottom-4 right-4 z-50 bg-white/95 backdrop-blur rounded-lg shadow-strong p-2 transition-transform hover:scale-105 animate-fade-in"
        aria-label="ICEF IAS Badge"
      >
        <span id="iasBadge" data-account-id={accountId} />
      </div>
    );
  }

  return <span id="iasBadge" data-account-id={accountId} />;
};

export default IasBadge;