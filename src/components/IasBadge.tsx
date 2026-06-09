import { useEffect } from "react";

const SCRIPT_SRC = "https://www-cdn.icef.com/scripts/iasbadgeid.js";

export const IasBadge = ({ accountId = "7243" }: { accountId?: string }) => {
  useEffect(() => {
    if (document.querySelector(`script[src="${SCRIPT_SRC}"]`)) return;
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.crossOrigin = "anonymous";
    document.body.appendChild(s);
  }, []);

  return <span id="iasBadge" data-account-id={accountId} />;
};

export default IasBadge;