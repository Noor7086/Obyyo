import { useEffect } from "react";

const TawkTo = () => {
    useEffect(() => {
        // @ts-ignore
        if (window.Tawk_API) return;

        // @ts-ignore
        window.Tawk_API = window.Tawk_API || {};
        // @ts-ignore
        window.Tawk_LoadStart = new Date();

        const script = document.createElement("script");
        script.async = true;
        script.src = "https://embed.tawk.to/6946ce5c6f335f197d617bb4/1jcu9c6rc";
        script.charset = "UTF-8";
        script.setAttribute("crossorigin", "*");

        document.body.appendChild(script);

        return () => {
            // Check if script is still a child of body before removing to avoid errors
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    return null;
};

export default TawkTo;
