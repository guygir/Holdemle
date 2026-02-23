import { THEME_KEY } from "@/lib/theme";

/**
 * Inline script to prevent flash of wrong theme. Runs before React hydrates.
 */
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){var t=localStorage.getItem("${THEME_KEY}");var m=window.matchMedia("(prefers-color-scheme:dark)");function u(){var d=t==="dark"||(t!="light"&&m.matches);document.documentElement.classList.toggle("dark",d);}u();m.addEventListener("change",u);})();`,
      }}
    />
  );
}
